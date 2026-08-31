import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Shared Redis connection options for BullMQ
export const connectionOptions = { url: redisUrl };

export const lowStockAlertQueue = new Queue("low-stock-alert", {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
