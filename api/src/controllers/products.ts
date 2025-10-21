import { redis } from "../redis";
import CatchAsync from "../utils/CatchAsync";
import { v4 as uuidv4 } from "uuid";

/** Escape ký tự đặc biệt cho RediSearch */
const esc = (s: string) =>
  (s || "").replace(/([@{}|\-+~"*/()\\[\]:^])/g, "\\$1");

/* =====================================================
 * 🟢 GET: Danh sách sản phẩm (giữ nguyên như bạn có)
 * ===================================================== */
export const getProducts = CatchAsync(async (req, res) => {
  const kwRaw = (req.query.kw as string) || "";
  const cat = (req.query.cat as string) || "";
  const p = Number(req.query.p) || 1;
  const LIMIT = 12;
  const skip = (p - 1) * LIMIT;

  const min = (req.query.min as string) ?? "-inf";
  const max = (req.query.max as string) ?? "+inf";

  const sortAllow = new Set(["price", "rating"]);
  const sortReq = (req.query.sort as string) || "price";
  const sort = sortAllow.has(sortReq) ? sortReq : "price";

  const orderReq = ((req.query.order as string) || "ASC").toUpperCase();
  const order = orderReq === "DESC" ? "DESC" : "ASC";

  const kw = kwRaw.trim();
  const parts: string[] = [];
  if (cat) parts.push(`@cat:{${esc(cat)}}`);
  parts.push(
    `'${
      kw ? `(@name:("${esc(kw)}")|@brand:("${esc(kw)}"))` : ""
    }@price:[${min} ${max}]'`
  );

  const query = parts.join(" ");

  const args = [
    "idx:product",
    query,
    "SORTBY",
    sort,
    order,
    "LIMIT",
    skip,
    LIMIT,
  ] as const;

  const raw = (await redis.call(
    "FT.SEARCH",
    ...(args as unknown as string)
  )) as any[];

  const total = Number(raw?.[0] || 0);
  const keys: string[] = [];
  for (let i = 1; i < raw.length; i += 2) keys.push(String(raw[i]));

  if (keys.length === 0) {
    return res.json({ total: 0, products: [] });
  }

  const m = (await redis.call("JSON.MGET", ...keys, "$")) as (string | null)[];
  const docs = m
    .map((p) => (p ? JSON.parse(p) : null))
    .filter(Boolean)
    .map((arr) => (Array.isArray(arr) ? arr[0] : arr));

  const totalPages = Math.ceil(total / LIMIT);

  const agg = (await redis.call(
    "FT.AGGREGATE",
    "idx:product",
    "*",
    "GROUPBY",
    "0",
    "REDUCE",
    "SUM",
    "1",
    "@sold",
    "AS",
    "totalSold"
  )) as any[];

  let totalSold = Number(agg[1][1]) || 0;
  res.json({ totalPages, total, totalSold, products: docs });
});

/* =====================================================
 * 🟢 GET: Chi tiết sản phẩm
 * ===================================================== */
export const getProductById = CatchAsync(async (req, res) => {
  const id = req.params.id;
  const key = `ecom:prod:${id}`;
  const data = await redis.call("JSON.GET", key, "$");
  if (!data) return res.status(404).json({ message: "Not found" });

  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  res.json(Array.isArray(parsed) ? parsed[0] : parsed);
});

/* =====================================================
 * 🟡 POST: Thêm sản phẩm (chuẩn theo seed)
 * ===================================================== */
export const createProduct = CatchAsync(async (req, res) => {
  const id = uuidv4();
  const key = `ecom:prod:${id}`;

  const product = {
    id,
    name: req.body.name,
    brand: req.body.brand || "",
    categoryId: req.body.categoryId || "uncategorized",
    price: Number(req.body.price) || 0,
    ratingAvg: Number(req.body.ratingAvg) || 0,
    sold: Number(req.body.sold) || 0,
    stock: Number(req.body.stock) || 0,
    desc: req.body.desc || "",
    image: req.body.image || "",
    createdAt: new Date().toISOString(),
  };

  // pipeline để ghi nhanh + đồng bộ index phụ
  const pipe = redis.pipeline();
  pipe.call("JSON.SET", key, "$", JSON.stringify(product));
  pipe.sadd(`ecom:cat:${product.categoryId}:products`, id);
  pipe.zadd("ecom:prod:by_price", product.price, id);
  pipe.zadd("ecom:prod:by_sold", product.sold, id);
  await pipe.exec();

  res.status(201).json({ message: "Product created", product });
});

/* =====================================================
 * 🔵 PUT: Cập nhật sản phẩm (đồng bộ sorted set & category)
 * ===================================================== */
export const updateProduct = CatchAsync(async (req, res) => {
  const id = req.params.id;
  const key = `ecom:prod:${id}`;

  const exists = await redis.exists(key);
  if (!exists) return res.status(404).json({ message: "Product not found" });

  const currentRaw = await redis.call("JSON.GET", key, "$");
  const current = JSON.parse(currentRaw as string)[0];

  const updated = {
    ...current,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  const pipe = redis.pipeline();
  pipe.call("JSON.SET", key, "$", JSON.stringify(updated));

  // nếu category đổi → xoá khỏi set cũ, thêm vào set mới
  if (updated.categoryId !== current.categoryId) {
    pipe.srem(`ecom:cat:${current.categoryId}:products`, id);
    pipe.sadd(`ecom:cat:${updated.categoryId}:products`, id);
  }

  // cập nhật lại sorted sets
  if (updated.price !== current.price)
    pipe.zadd("ecom:prod:by_price", updated.price, id);
  if (updated.sold !== current.sold)
    pipe.zadd("ecom:prod:by_sold", updated.sold, id);

  await pipe.exec();

  res.json({ message: "Product updated", product: updated });
});

/* =====================================================
 * 🔴 DELETE: Xoá sản phẩm (xoá hết index phụ)
 * ===================================================== */
export const deleteProduct = CatchAsync(async (req, res) => {
  const id = req.params.id;
  const key = `ecom:prod:${id}`;

  const data = await redis.call("JSON.GET", key, "$");
  if (!data) return res.status(404).json({ message: "Product not found" });

  const parsed = JSON.parse(data as string)[0];

  const pipe = redis.pipeline();
  pipe.del(key);
  pipe.srem(`ecom:cat:${parsed.categoryId}:products`, id);
  pipe.zrem("ecom:prod:by_price", id);
  pipe.zrem("ecom:prod:by_sold", id);
  await pipe.exec();

  res.json({ message: "Product deleted", id });
});
