import { Worker, Job } from "bullmq";
import prisma from "../lib/prisma";
import { connectionOptions } from "../lib/queue";

interface LowStockAlertPayload {
  productId: string;
  warehouseId: string;
}

const INBOUND_TYPES = ["IN", "TRANSFER_IN", "ADJUSTMENT_IN"] as const;

async function getCurrentStock(
  productId: string,
  warehouseId: string
): Promise<number> {
  const [inbound, outbound] = await Promise.all([
    prisma.stockMovement.aggregate({
      where: {
        productId,
        warehouseId,
        type: { in: [...INBOUND_TYPES] },
      },
      _sum: { quantity: true },
    }),
    prisma.stockMovement.aggregate({
      where: {
        productId,
        warehouseId,
        type: { in: ["OUT", "TRANSFER_OUT", "ADJUSTMENT_OUT"] },
      },
      _sum: { quantity: true },
    }),
  ]);

  return (inbound._sum.quantity ?? 0) - (outbound._sum.quantity ?? 0);
}

async function processLowStockCheck(job: Job<LowStockAlertPayload>) {
  const { productId, warehouseId } = job.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isActive) {
    return { skipped: true, reason: "Product not found or inactive" };
  }

  const currentStock = await getCurrentStock(productId, warehouseId);

  if (currentStock >= product.reorderPoint) {
    return { skipped: true, reason: "Stock is above reorder point" };
  }

  // Find all ADMIN and MANAGER users
  const managerUsers = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "MANAGER"] },
      isActive: true,
    },
    select: { id: true },
  });

  if (managerUsers.length === 0) {
    return { skipped: true, reason: "No ADMIN/MANAGER users found" };
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
    select: { name: true },
  });

  const message = `Low stock alert: "${product.name}" (${product.sku}) at ${warehouse?.name ?? "unknown warehouse"} has ${currentStock} ${product.unit} remaining (reorder point: ${product.reorderPoint}).`;

  // Create notifications for all ADMIN/MANAGER users
  const notifications = await prisma.notification.createMany({
    data: managerUsers.map((user) => ({
      userId: user.id,
      message,
    })),
  });

  return {
    productId,
    warehouseId,
    currentStock,
    reorderPoint: product.reorderPoint,
    notificationsCreated: notifications.count,
  };
}

const worker = new Worker("low-stock-alert", processLowStockCheck, {
  connection: connectionOptions,
  concurrency: 5,
});

worker.on("completed", (job) => {
  const result = job.returnvalue as Record<string, unknown> | undefined;
  if (result && !result.skipped) {
    console.log(
      `[LowStockWorker] Job ${job.id} completed: created ${result.notificationsCreated} notifications`
    );
  }
});

worker.on("failed", (job, err) => {
  console.error(`[LowStockWorker] Job ${job?.id} failed: ${err.message}`);
});

console.log("[LowStockWorker] Worker started, listening for low-stock-alert jobs");

export default worker;
