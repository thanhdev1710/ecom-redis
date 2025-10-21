import { redis } from "../redis";
import CatchAsync from "../utils/CatchAsync";

const norm = (s: string) =>
  String(s || "")
    .trim()
    .toLowerCase();

/** GET /api/admin/users?p=1&limit=20&q=keyword */
export const listUsers = CatchAsync(async (req, res) => {
  const p = Math.max(1, Number(req.query.p) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const q = String(req.query.q || "")
    .trim()
    .toLowerCase();

  const start = (p - 1) * limit;
  const end = start + limit - 1;

  const total = await redis.zcard("ecom:users:by_createdAt");
  const emails = await redis.zrevrange("ecom:users:by_createdAt", start, end);

  if (emails.length === 0)
    return res.json({ ok: true, total, page: p, limit, users: [] });

  const pipe = redis.pipeline();
  emails.forEach((e) => pipe.hgetall(`ecom:user:${e}`));
  const rows = (await pipe.exec())?.map(([, v]) => v) || [];

  let users = rows
    .map((u: any) => {
      if (!u) return null;
      u.role = u.role || "user";
      delete u.password;
      return u;
    })
    .filter(Boolean) as any[];

  if (q) {
    users = users.filter((u) => {
      const hay = `${u.email || ""} ${u.fullName || ""} ${
        u.phone || ""
      }`.toLowerCase();
      return hay.includes(q);
    });
  }

  res.json({ ok: true, total, page: p, limit, users });
});

/** PATCH /api/admin/users/:email  { fullName?, phone?, location? } */
export const updateUserBasic = CatchAsync(async (req, res) => {
  const email = norm(req.params.email);
  const key = `ecom:user:${email}`;

  const exists = await redis.exists(key);
  if (!exists)
    return res.status(404).json({ ok: false, message: "User not found" });

  const patch: Record<string, string> = {};
  ["fullName", "phone", "location"].forEach((k) => {
    if (typeof req.body?.[k] === "string")
      patch[k] = String(req.body[k]).trim();
  });
  if (Object.keys(patch).length === 0) {
    return res
      .status(400)
      .json({ ok: false, message: "No valid fields to update" });
  }
  await redis.hset(key, patch as any);
  const user = await redis.hgetall(key);
  user.role = user.role || "user";
  delete (user as any).password;
  res.json({ ok: true, user });
});

/** PATCH /api/admin/users/:email/role  { role: "admin" | "user" } */
export const updateUserRole = CatchAsync(async (req, res) => {
  const email = norm(req.params.email);
  const key = `ecom:user:${email}`;

  const exists = await redis.exists(key);
  if (!exists)
    return res.status(404).json({ ok: false, message: "User not found" });

  const role = String(req.body?.role || "").toLowerCase();
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ ok: false, message: "Invalid role" });
  }

  await redis.hset(key, { role });
  const user = await redis.hgetall(key);
  user.role = user.role || "user";
  delete (user as any).password;
  res.json({ ok: true, user });
});

/** PATCH /api/admin/users/:email/lock  { isLocked: true|false } */
export const toggleLockUser = CatchAsync(async (req, res) => {
  const email = norm(req.params.email);
  const key = `ecom:user:${email}`;

  const exists = await redis.exists(key);
  if (!exists)
    return res.status(404).json({ ok: false, message: "User not found" });

  const isLocked = !!req.body?.isLocked;
  await redis.hset(key, "isLocked", isLocked ? "1" : "0");
  const user = await redis.hgetall(key);
  user.role = user.role || "user";
  delete (user as any).password;
  res.json({ ok: true, user });
});
