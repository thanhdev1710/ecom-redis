import Redis from "ioredis";

const url =
  process.env.REDIS_URL || "redis://:SuperStrongPassw0rd!@localhost:6379";

export const redis = new Redis(url);
