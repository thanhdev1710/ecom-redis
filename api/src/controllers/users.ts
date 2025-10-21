import { redis } from "../redis";
import CatchAsync from "../utils/CatchAsync";
import bcrypt from "bcryptjs";

/* -------------------- Helpers -------------------- */
const normalizeEmail = (email: string) => String(email).trim().toLowerCase();
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* =================================================
 * 🧠 Đăng ký (email là UID)
 * ===============================================*/
export const registerUser = CatchAsync(async (req, res) => {
  const { password, fullName, email, phone, location } = req.body || {};

  if (!email || !password)
    return res
      .status(400)
      .json({ ok: false, message: "Thiếu email hoặc mật khẩu" });

  const emailNorm = normalizeEmail(email);
  if (!isValidEmail(emailNorm))
    return res.status(400).json({ ok: false, message: "Email không hợp lệ" });

  // set chứa toàn bộ email để chống trùng
  const EMAIL_SET = "ecom:emails";

  const exists = await redis.sismember(EMAIL_SET, emailNorm);
  if (exists)
    return res
      .status(400)
      .json({ ok: false, message: "Email đã được sử dụng" });

  const uid = emailNorm;
  const hash = await bcrypt.hash(password, 10);

  const userKey = `ecom:user:${uid}`;
  await redis.hset(userKey, {
    email: emailNorm,
    password: hash,
    role: "user",
    createdAt: Date.now().toString(),
    fullName: fullName?.trim() || "",
    phone: (phone || "").toString().trim(),
    location: (location || "").toString().trim(),
  });

  await redis.sadd(EMAIL_SET, emailNorm);

  await redis.sadd("ecom:listemail", email);
  await redis.zadd("ecom:users:by_createdAt", Date.now(), email);

  return res.json({
    ok: true,
    user: {
      email: emailNorm,
      fullName: fullName || "",
      phone: phone || "",
      location: location || "",
      role: "user",
      createdAt: Date.now(),
    },
  });
});

/* =================================================
 * 🔐 Đăng nhập (dùng email)
 * ===============================================*/
export const loginUser = CatchAsync(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password)
    return res
      .status(400)
      .json({ ok: false, message: "Thiếu email hoặc mật khẩu" });

  const uid = normalizeEmail(email);
  const userKey = `ecom:user:${uid}`;
  const user = await redis.hgetall(userKey);

  if (!user || !user.password)
    return res.status(404).json({ ok: false, message: "Không tìm thấy user" });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ ok: false, message: "Sai mật khẩu" });

  return res.json({
    ok: true,
    user: {
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      location: user.location,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

/* =================================================
 * 👤 Lấy thông tin user
 * :uid là email (đã normalize ở FE hoặc Router)
 * ===============================================*/
export const getUserById = CatchAsync(async (req, res) => {
  const uid = normalizeEmail(req.params.uid);
  const userKey = `ecom:user:${uid}`;
  const user = await redis.hgetall(userKey);

  if (!user || !user.email)
    return res.status(404).json({ ok: false, message: "User không tồn tại" });

  delete user.password;
  return res.json({ ok: true, user });
});

/* =================================================
 * 📦 Đơn hàng theo user
 * ===============================================*/
export const getUserOrders = CatchAsync(async (req, res) => {
  const uid = normalizeEmail(req.params.uid);
  const ordersKey = `ecom:user:${uid}:orders`;

  const orderIds = await redis.lrange(ordersKey, 0, -1);
  if (!orderIds || orderIds.length === 0) {
    return res.json({ ok: true, orders: [] });
  }

  const orders = await Promise.all(
    orderIds.map(async (oid) => {
      const orderKey = `ecom:order:${oid}`;
      const raw = await redis.call("JSON.GET", orderKey, "$");
      if (!raw) return null;

      const order = JSON.parse(raw as string)[0];

      // Bổ sung product cho từng item
      const itemsWithProduct = await Promise.all(
        (order.items || []).map(async (item: any) => {
          const productKey = `ecom:prod:${item.pid}`;
          const productRaw = await redis.call("JSON.GET", productKey, "$");
          if (!productRaw) return item;

          const product = JSON.parse(productRaw as string)[0];
          return { ...item, product };
        })
      );

      order.items = itemsWithProduct;
      return order;
    })
  );

  const validOrders = orders.filter(Boolean);
  return res.json({ ok: true, orders: validOrders });
});

/* =================================================
 * 🗑️ Xóa user
 * ===============================================*/
export const deleteUser = CatchAsync(async (req, res) => {
  const uid = normalizeEmail(req.params.uid);
  const userKey = `ecom:user:${uid}`;

  const exists = await redis.exists(userKey);
  if (!exists)
    return res.status(404).json({ ok: false, message: "User không tồn tại" });

  const pipe = redis.pipeline();
  pipe.del(userKey);
  pipe.srem("ecom:listemail", uid);
  pipe.zrem("ecom:users:by_createdAt", uid);
  await pipe.exec();

  return res.json({ ok: true, message: "Đã xóa user" });
});

/* =================================================
 * 🔐 Kiểm tra vai trò (nếu có dùng)
 * ===============================================*/
export const requireRole = (roles: string[]) => {
  return CatchAsync(async (req, res, next) => {
    const uid = normalizeEmail(req.params.uid);
    const user = await redis.hgetall(`ecom:user:${uid}`);
    console.log(uid, user);

    if (!user || !user.role || !roles.includes(user.role)) {
      return res.status(403).json({ ok: false, message: "Không có quyền" });
    }
    next();
  });
};

/* =================================================
 * ✏️ Cập nhật hồ sơ (không đổi email)
 * ===============================================*/
export const updateUser = CatchAsync(async (req, res) => {
  const uid = normalizeEmail(req.params.uid);
  const userKey = `ecom:user:${uid}`;

  const exists = await redis.exists(userKey);
  if (!exists) {
    return res.status(404).json({ ok: false, message: "User không tồn tại" });
  }

  // Không cho đổi các field nhạy cảm
  delete req.body.username;
  delete req.body.email; // ❌ email là khóa chính => không cho đổi
  delete req.body.password;
  delete req.body.role;
  delete req.body.createdAt;

  // Whitelist
  const ALLOWED = ["fullName", "phone", "location"] as const;
  type AllowedKey = (typeof ALLOWED)[number];
  const patch: Partial<Record<AllowedKey, string>> = {};

  for (const k of ALLOWED) {
    if (k in req.body && typeof req.body[k] === "string") {
      patch[k] = String(req.body[k]).trim();
    }
  }

  if (Object.keys(patch).length === 0) {
    return res
      .status(400)
      .json({ ok: false, message: "Không có trường hợp lệ để cập nhật" });
  }

  await redis.hset(userKey, patch as any);

  const updated = await redis.hgetall(userKey);
  delete updated.password;

  return res.json({ ok: true, user: updated });
});

/* =================================================
 * 🔑 Đổi mật khẩu (đơn giản)
 * ===============================================*/
export const changePassword = CatchAsync(async (req, res) => {
  const uid = normalizeEmail(req.params.uid);
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ ok: false, message: "Thiếu currentPassword hoặc newPassword" });
  }

  const userKey = `ecom:user:${uid}`;
  const user = await redis.hgetall(userKey);
  if (!user || !user.password) {
    return res.status(404).json({ ok: false, message: "User không tồn tại" });
  }

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    return res
      .status(401)
      .json({ ok: false, message: "Mật khẩu hiện tại không đúng" });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await redis.hset(userKey, { password: newHash });

  return res.json({ ok: true, message: "Đổi mật khẩu thành công" });
});
