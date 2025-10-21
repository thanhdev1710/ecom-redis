import { redis } from "../redis";
import CatchAsync from "../utils/CatchAsync";

/** GET /api/admin/orders?status=PLACED&from=timestamp&to=timestamp&p=1&limit=20 */
export const listOrders = CatchAsync(async (req, res) => {
  const status = String(req.query.status || "")
    .trim()
    .toUpperCase(); // optional
  const from = Number(req.query.from || 0); // ms
  const to = Number(req.query.to || Date.now()); // ms
  const p = Math.max(1, Number(req.query.p) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  // Lấy candidate IDs theo thời gian (mới → cũ)
  const ids = await redis.zrevrangebyscore(
    "ecom:orders:by_time",
    to,
    from,
    "LIMIT",
    (p - 1) * limit,
    limit
  );

  if (ids.length === 0)
    return res.json({ ok: true, total: 0, page: p, limit, orders: [] });

  // Nếu có filter status → lọc tiếp bằng SISMEMBER (nhanh)
  let filtered = ids;
  if (status) {
    const pipe = redis.pipeline();
    ids.forEach((id) => pipe.sismember(`ecom:orders:by_status:${status}`, id));
    const flags = (await pipe.exec())?.map(([, v]) => Number(v)) || [];
    filtered = ids.filter((_, i) => flags[i] === 1);
  }

  // Lấy chi tiết
  const jpipe = redis.pipeline();
  filtered.forEach((id) => jpipe.call("JSON.GET", `ecom:order:${id}`, "$"));
  const raws = (await jpipe.exec())?.map(([, v]) => v) || [];

  const orders = raws
    .map((raw: any) => (raw ? JSON.parse(raw as string)[0] : null))
    .filter(Boolean);

  // total “thô” theo thời gian (không chuẩn tuyệt đối khi còn filter status).
  const total = await redis.zcount("ecom:orders:by_time", from, to);

  res.json({ ok: true, total, page: p, limit, orders });
});

/** PATCH /api/admin/orders/:oid/status { status: "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELED" } */
export const updateOrderStatus = CatchAsync(async (req, res) => {
  const oid = String(req.params.oid);
  const key = `ecom:order:${oid}`;

  const data = await redis.call("JSON.GET", key, "$");
  if (!data)
    return res.status(404).json({ ok: false, message: "Order not found" });

  const order = JSON.parse(data as string)[0];
  const fromStatus = String(order.status || "PLACED").toUpperCase();
  const toStatus = String(req.body?.status || "").toUpperCase();

  const ALLOW = new Set([
    "PLACED",
    "PROCESSING",
    "SHIPPED",
    "COMPLETED",
    "CANCELED",
  ]);
  if (!ALLOW.has(toStatus)) {
    return res.status(400).json({ ok: false, message: "Invalid status" });
  }

  order.status = toStatus;
  order.updatedAt = Date.now();

  const pipe = redis.pipeline();
  pipe.call("JSON.SET", key, "$", JSON.stringify(order));
  // cập nhật set theo status
  if (fromStatus !== toStatus) {
    pipe.srem(`ecom:orders:by_status:${fromStatus}`, oid);
    pipe.sadd(`ecom:orders:by_status:${toStatus}`, oid);
  }
  await pipe.exec();

  res.json({ ok: true, order });
});
