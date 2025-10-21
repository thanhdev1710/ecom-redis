import { redis } from "../redis";
import CatchAsync from "../utils/CatchAsync";

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

  const orderDoc = {
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
