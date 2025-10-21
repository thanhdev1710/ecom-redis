// seed.js
const Redis = require("ioredis");
const bcrypt = require("bcryptjs");
const data = require("./data.json");

const DEFAULT_URL = "redis://:SuperStrongPassw0rd!@localhost:6379";
const redis = new Redis(process.env.REDIS_URL || DEFAULT_URL);

async function ensureIndex() {
  try {
    await redis.call(
      "FT.CREATE",
      "idx:product",
      "ON",
      "JSON",
      "PREFIX",
      "1",
      "ecom:prod:",
      "SCHEMA",
      "$.name",
      "AS",
      "name",
      "TEXT",
      "WEIGHT",
      "5.0",
      "$.brand",
      "AS",
      "brand",
      "TEXT",
      "$.price",
      "AS",
      "price",
      "NUMERIC",
      "SORTABLE",
      "$.ratingAvg",
      "AS",
      "rating",
      "NUMERIC",
      "SORTABLE",
      "$.sold",
      "AS",
      "sold",
      "NUMERIC",
      "$.categoryId",
      "AS",
      "cat",
      "TAG"
    );
    console.log("✅ Created index idx:product");
  } catch (e) {
    if (String(e).includes("Index already exists")) {
      console.log("ℹ️ Index already exists, skipping create");
    } else throw e;
  }
}

async function seedProducts() {
  const pipe = redis.pipeline();
  for (const p of data) {
    p.sold = 0; // reset sold về 0 cho toàn bộ
    pipe.call("JSON.SET", `ecom:prod:${p.id}`, "$", JSON.stringify(p));
    pipe.sadd(`ecom:cat:${p.categoryId}:products`, p.id);
    pipe.zadd("ecom:prod:by_price", p.price, p.id);
    pipe.zadd("ecom:prod:by_sold", 0, p.id);
  }
  await pipe.exec();
  console.log(`✅ Seeded ${data.length} products (sold=0)`);
}

async function seedAdmin() {
  const email = "admin@gmail.com";
  const key = `ecom:user:${email}`;
  const exists = await redis.exists(key);
  if (exists) {
    console.log("⚠️ Admin user already exists, skipping.");
    return;
  }

  const hash = await bcrypt.hash("admin123", 10);
  const now = Date.now();

  const adminData = {
    email,
    password: hash,
    fullName: "Administrator",
    phone: "0900000000",
    location: "123 Admin",
    role: "admin",
    createdAt: now,
    updatedAt: now,
  };

  const pipe = redis.pipeline();
  pipe.hset(key, adminData);
  pipe.sadd("ecom:listemail", email);
  pipe.zadd("ecom:users:by_createdAt", now, email);
  await pipe.exec();

  console.log("✅ Created default admin account:");
  console.log("   Email: admin@gmail.com");
  console.log("   Password: admin123");
}

async function migrateUsers() {
  const emails = await redis.smembers("ecom:listemail");
  const pipe = redis.pipeline();

  for (const email of emails) {
    const key = `ecom:user:${email}`;
    const u = await redis.hgetall(key);
    if (!u || !u.createdAt) continue;

    pipe.zadd(
      "ecom:users:by_createdAt",
      Number(u.createdAt) || Date.now(),
      email
    );

    if (u.rule && !u.role) {
      pipe.hset(key, "role", u.rule);
      pipe.hdel(key, "rule");
    }

    pipe.sadd("ecom:listemail", email);
  }

  await pipe.exec();
  console.log("✅ User migration done.");
}

async function main() {
  await ensureIndex();
  await seedProducts();
  await migrateUsers();
  await seedAdmin();
}

(async () => {
  try {
    await main();
    console.log("🎉 All seed completed successfully!");
  } catch (err) {
    console.error("❌ Seed lỗi:", err);
    process.exitCode = 1;
  } finally {
    await redis.quit();
  }
})();
