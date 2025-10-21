// controllers/admin.analytics.ts
import { redis } from "../redis";
import CatchAsync from "../utils/CatchAsync";

type Bucket = "day" | "week" | "month";

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const startOfWeek = (d: Date) => {
  const nd = new Date(d);
  const day = nd.getDay(); // 0 Sun
  const dif = (day + 6) % 7; // Monday-based
  nd.setDate(nd.getDate() - dif);
  nd.setHours(0, 0, 0, 0);
  return nd.getTime();
};
const startOfMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), 1).getTime();

function bucketize(ts: number, bucket: Bucket) {
  const d = new Date(ts);
  if (bucket === "day") return startOfDay(d);
  if (bucket === "week") return startOfWeek(d);
  return startOfMonth(d);
}

/** GET /api/admin/analytics/revenue?bucket=day|week|month&from=&to= */
export const revenueOverTime = CatchAsync(async (req, res) => {
  const bucket = String(req.query.bucket || "day") as Bucket;
  const from = Number(req.query.from || Date.now() - 30 * 24 * 3600 * 1000); // default 30 ngày
  const to = Number(req.query.to || Date.now());

  // lấy order ids theo time
  const ids = await redis.zrangebyscore("ecom:orders:by_time", from, to);
  if (ids.length === 0) return res.json({ ok: true, series: [] });

  const pipe = redis.pipeline();
  ids.forEach((id) => pipe.call("JSON.GET", `ecom:order:${id}`, "$"));
  const raws = (await pipe.exec())?.map(([, v]) => v) || [];

  const map = new Map<number, number>(); // bucketTs -> revenue
  raws.forEach((raw: any) => {
    if (!raw) return;
    const order = JSON.parse(raw as string)[0];
    // chỉ tính doanh thu đơn hoàn tất? tuỳ bạn.
    if (!order || !order.total) return;
    const ts = bucketize(Number(order.createdAt || Date.now()), bucket);
    map.set(ts, (map.get(ts) || 0) + Number(order.total || 0));
  });

  const series = Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([t, v]) => ({ t, total: v }));

  res.json({ ok: true, bucket, from, to, series });
});

export const topProducts = CatchAsync(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit) || 10);
  // ZREVRANGE theo sold cao → thấp, nhưng ZSET của bạn đang lưu <member = productId, score = sold>
  const ids = await redis.zrevrange("ecom:prod:by_sold", 0, limit - 1);

  if (ids.length === 0) return res.json({ ok: true, products: [] });

  const pipe = redis.pipeline();
  ids.forEach((id) => pipe.call("JSON.GET", `ecom:prod:${id}`, "$"));
  const raws = (await pipe.exec())?.map(([, v]) => v) || [];

  const products = raws
    .map((raw: any) => (raw ? JSON.parse(raw as string)[0] : null))
    .filter(Boolean);

  res.json({ ok: true, products });
});
