import prisma from "./prisma";

const INBOUND_TYPES = ["IN", "TRANSFER_IN", "ADJUSTMENT_IN"] as const;

/**
 * Calculate current stock for all product-warehouse pairs.
 * Returns a Map keyed by `${productId}:${warehouseId}` → net quantity.
 * This is the single source of truth for current_stock calculation.
 */
async function getAllStockByProductWarehouse(): Promise<Map<string, number>> {
  const movements = await prisma.stockMovement.groupBy({
    by: ["productId", "warehouseId", "type"],
    _sum: { quantity: true },
  });

  const stockMap = new Map<string, number>();

  for (const m of movements) {
    const key = `${m.productId}:${m.warehouseId}`;
    const current = stockMap.get(key) ?? 0;
    const qty = m._sum.quantity ?? 0;

    if (INBOUND_TYPES.includes(m.type as typeof INBOUND_TYPES[number])) {
      stockMap.set(key, current + qty);
    } else {
      stockMap.set(key, current - qty);
    }
  }

  return stockMap;
}

/**
 * Calculate current stock per product (summed across all warehouses).
 * Returns a Map keyed by productId → net quantity.
 */
async function getAllStockByProduct(): Promise<Map<string, number>> {
  const movements = await prisma.stockMovement.groupBy({
    by: ["productId", "type"],
    _sum: { quantity: true },
  });

  const stockMap = new Map<string, number>();

  for (const m of movements) {
    const current = stockMap.get(m.productId) ?? 0;
    const qty = m._sum.quantity ?? 0;

    if (INBOUND_TYPES.includes(m.type as typeof INBOUND_TYPES[number])) {
      stockMap.set(m.productId, current + qty);
    } else {
      stockMap.set(m.productId, current - qty);
    }
  }

  return stockMap;
}

/**
 * Calculate current stock for a single product-warehouse pair.
 */
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

export const stockCalculator = {
  getAllStockByProductWarehouse,
  getAllStockByProduct,
  getCurrentStock,
};
