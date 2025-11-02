import { redis } from "../redis";
import CatchAsync from "../utils/CatchAsync";

type OrderDoc = {
  id: string;
  uid: string; // email (lowercase)
  items: { pid: string; qty: number }[];
  total: number;
  status: string;
  createdAt: number; // ms epoch
};

const normalizeEmail = (email: string) =>
  String(email || "")
    .trim()
    .toLowerCase();

export const submitOrderByUserId = CatchAsync(async (req, res) => {
  const uid = normalizeEmail(req.params.uid);
  const cartKey = `ecom:cart:${uid}`;

  // 🛒 Lấy toàn bộ cart (Hash: pid -> qty)
  const cartEntries = await redis.hgetall(cartKey);
  if (!cartEntries || Object.keys(cartEntries).length === 0) {
    return res.status(400).json({ ok: false, message: "Giỏ hàng trống" });
  }

  // 📦 Chuẩn hoá danh sách pid/qty
  const pids = Object.keys(cartEntries);
  const qtys = pids.map((pid) =>
    Math.max(1, parseInt(cartEntries[pid] as any, 10) || 1)
  );
  const prodKeys = pids.map((pid) => `ecom:prod:${pid}`);

  // 🔎 Lấy thông tin sản phẩm (price/stock/sold) qua JSON.MGET "$"
  const prodsRaw = (await redis.call("JSON.MGET", ...prodKeys, "$")) as (
    | string
    | null
  )[];
  type ProdInfo = { price: number; stock: number; sold: number };
  const infos: ProdInfo[] = prodsRaw.map((r) => {
    try {
      const arr = r ? JSON.parse(r) : null;
      const obj = Array.isArray(arr) ? arr[0] : arr;
      return {
        price: Number(obj?.price ?? 0),
        stock: Number(obj?.stock ?? 0),
        sold: Number(obj?.sold ?? 0),
      };
    } catch {
      return { price: 0, stock: 0, sold: 0 };
    }
  });

  // 🧮 Tính total & build items (dùng qty yêu cầu để hiển thị)
  const items = pids.map((pid, i) => ({ pid, qty: qtys[i] }));
  const total = items.reduce((sum, it, i) => sum + infos[i].price * it.qty, 0);

  // 🧾 Tạo order mới
  const nextSeq = await redis.incr("ecom:seq:order");
  const oid = String(nextSeq);
  const orderKey = `ecom:order:${oid}`;

  const orderDoc: OrderDoc = {
    id: oid,
    uid, // email (lowercase)
    items,
    total,
    status: "PLACED",
    createdAt: Date.now(),
  };

  // 📉📈 Giảm stock / Tăng sold cho từng sản phẩm
  // - dec = min(stock hiện tại, qty đặt)
  // - stock_new = stock - dec (>= 0)
  // - sold_new = sold + dec
  // - Đồng bộ sorted set by_sold: ZINCRBY dec
  const pipe = redis.pipeline();

  // Ghi order + gắn vào list orders của user
  pipe.call("JSON.SET", orderKey, "$", JSON.stringify(orderDoc));
  pipe.lpush(`ecom:user:${uid}:orders`, oid);
  // Index phụ cho order
  pipe.zadd("ecom:orders:by_time", orderDoc.createdAt, orderDoc.id);
  pipe.sadd(`ecom:orders:by_status:${orderDoc.status}`, orderDoc.id);

  for (let i = 0; i < pids.length; i++) {
    const pid = pids[i];
    const key = prodKeys[i];
    const want = qtys[i];
    const have = Math.max(0, infos[i].stock);
    const dec = Math.min(have, want); // số lượng thực sự trừ kho / tăng sold

    if (dec > 0) {
      // JSON.NUMINCRBY cho stock (-dec) & sold (+dec)
      pipe.call("JSON.NUMINCRBY", key, "$.stock", String(-dec));
      pipe.call("JSON.NUMINCRBY", key, "$.sold", String(dec));
      // Đồng bộ sorted set bán chạy
      pipe.zincrby("ecom:prod:by_sold", dec, pid);
    }
  }

  // 🧹 Xóa giỏ sau khi tạo order
  pipe.del(cartKey);

  await pipe.exec();

  return res.json({ ok: true, order: orderDoc });
});

// GET /orders/:uid?offset=0&limit=50
export const getOrdersByUserId = CatchAsync(async (req, res) => {
  const uid = normalizeEmail(req.params.uid);

  // 1) Lấy toàn bộ OID của user (mới nhất ở index 0 do dùng LPUSH)
  const keyList = `ecom:user:${uid}:orders`;
  const totalOrders = (await redis.llen(keyList)) as number;

  if (!totalOrders || totalOrders <= 0) {
    return res
      .status(404)
      .json({ ok: false, message: "Người dùng chưa có đơn hàng" });
  }

  // Pagination nhẹ (tùy chọn)
  const offset = Math.max(
    0,
    parseInt(String(req.query.offset ?? "0"), 10) || 0
  );
  const limit = Math.max(
    1,
    parseInt(String(req.query.limit ?? "100"), 10) || 100
  );
  const start = offset;
  const end = Math.min(offset + limit - 1, totalOrders - 1);

  const oids = (await redis.lrange(keyList, start, end)) as string[]; // newest → older
  if (!oids || oids.length === 0) {
    return res
      .status(404)
      .json({
        ok: false,
        message: "Không tìm thấy đơn hàng trong khoảng đã chọn",
      });
  }

  // 2) Đọc orders theo OIDs (batch)
  const orderKeys = oids.map((oid) => `ecom:order:${oid}`);
  const ordersRaw = (await redis.call("JSON.MGET", ...orderKeys, "$")) as (
    | string
    | null
  )[];

  // Parse + lọc null/hỏng
  const orders: OrderDoc[] = [];
  for (const r of ordersRaw) {
    if (!r) continue;
    try {
      const arr = JSON.parse(r);
      const obj = Array.isArray(arr) ? arr[0] : arr;
      if (obj && obj.id && obj.uid) orders.push(obj as OrderDoc);
    } catch {
      // bỏ qua order hỏng dữ liệu
    }
  }
  if (orders.length === 0) {
    return res
      .status(404)
      .json({ ok: false, message: "Không đọc được dữ liệu đơn hàng" });
  }

  // 3) Đọc user HASH để lấy fullName/phone
  const userHash = (await redis.hgetall(`ecom:user:${uid}`)) as Record<
    string,
    string
  >;
  const customerBase = {
    name: (userHash?.fullName || userHash?.email || uid) as string,
    phone: (userHash?.phone ?? null) as string | null,
  };

  // 4) Gom tất cả pid duy nhất trong mọi order → đọc sản phẩm 1 lần
  const pidSet = new Set<string>();
  for (const od of orders) for (const it of od.items || []) pidSet.add(it.pid);
  const pids = Array.from(pidSet);
  let pidMap = new Map<string, { name?: string; price?: number }>();

  if (pids.length > 0) {
    const prodKeys = pids.map((pid) => `ecom:prod:${pid}`);
    const prodsRaw = (await redis.call("JSON.MGET", ...prodKeys, "$")) as (
      | string
      | null
    )[];
    prodsRaw.forEach((r, i) => {
      if (!r) return;
      try {
        const arr = JSON.parse(r);
        const obj = Array.isArray(arr) ? arr[0] : arr;
        pidMap.set(pids[i], {
          name: obj?.name,
          price: Number(obj?.price ?? 0),
        });
      } catch {
        // ignore lỗi parse
      }
    });
  }

  // 5) Build mảng "pretty"
  const data = orders.map((order) => {
    const items = (order.items || []).map((it) => {
      const info = pidMap.get(it.pid) || {};
      const name = info.name ?? it.pid;
      const unitPrice = Number.isFinite(info.price as number)
        ? (info.price as number)
        : 0;
      return { name, qty: it.qty, unitPrice };
    });

    // Ưu tiên tổng tiền đã lưu trong order (đã “đóng băng” tại thời điểm đặt)
    const total = Number.isFinite(order.total)
      ? Number(order.total)
      : items.reduce((s, it) => s + it.qty * it.unitPrice, 0);

    return {
      id: order.id,
      status: String(order.status || "").toLowerCase(),
      createdAt: new Date(order.createdAt || Date.now()).toISOString(),
      customer: customerBase,
      items,
      total,
    };
  });

  return res.json({
    ok: true,
    paging: { total: totalOrders, offset, limit, returned: data.length },
    data, // newest → older
  });
});
