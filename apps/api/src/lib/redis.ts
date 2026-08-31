import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
});

redis.on("error", (err) => {
  console.error(`[Redis] Connection error: ${err.message}`);
});

redis.on("connect", () => {
  console.log("[Redis] Connected successfully");
});

export default redis;
