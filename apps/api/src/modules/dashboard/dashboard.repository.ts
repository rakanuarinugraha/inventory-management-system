import prisma from "../../lib/prisma";

export class DashboardRepository {
  async getTotalInventoryValue() {
    const movements = await prisma.stockMovement.groupBy({
      by: ["productId", "type"],
      _sum: { quantity: true },
    });

    const stockByProduct: Record<string, number> = {};
    const inboundTypes = ["IN", "TRANSFER_IN", "ADJUSTMENT_IN"];

    for (const m of movements) {
      const current = stockByProduct[m.productId] || 0;
      if (inboundTypes.includes(m.type)) {
        stockByProduct[m.productId] = current + (m._sum.quantity ?? 0);
      } else {
        stockByProduct[m.productId] = current - (m._sum.quantity ?? 0);
      }
    }

    const productIds = Object.keys(stockByProduct).filter(
      (id) => stockByProduct[id] > 0
    );

    if (productIds.length === 0) {
      return { totalValue: 0, productCount: 0 };
    }

    // Get latest unit price per product from PO items
    const latestPrices = await prisma.$queryRaw<
      { productId: string; unitPrice: number }[]
    >`
      SELECT DISTINCT ON (poi.product_id)
        poi.product_id AS "productId",
        poi.unit_price::float AS "unitPrice"
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.po_id = po.id
      WHERE poi.product_id = ANY(${productIds}::text[])
      ORDER BY poi.product_id, po.created_at DESC
    `;

    const priceMap: Record<string, number> = {};
    for (const row of latestPrices) {
      priceMap[row.productId] = row.unitPrice;
    }

    let totalValue = 0;
    for (const productId of productIds) {
      const qty = stockByProduct[productId] || 0;
      const price = priceMap[productId] || 0;
      totalValue += qty * price;
    }

    return { totalValue, productCount: productIds.length };
  }

  async getLowStockCount() {
    const movements = await prisma.stockMovement.groupBy({
      by: ["productId", "type"],
      _sum: { quantity: true },
      where: { product: { isActive: true } },
    });

    const stockMap: Record<string, number> = {};
    const inboundTypes = ["IN", "TRANSFER_IN", "ADJUSTMENT_IN"];

    for (const m of movements) {
      const current = stockMap[m.productId] || 0;
      if (inboundTypes.includes(m.type)) {
        stockMap[m.productId] = current + (m._sum.quantity ?? 0);
      } else {
        stockMap[m.productId] = current - (m._sum.quantity ?? 0);
      }
    }

    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, reorderPoint: true },
    });

    const lowStockCount = products.filter(
      (p) => (stockMap[p.id] || 0) <= p.reorderPoint
    ).length;

    return { lowStockCount };
  }

  async getRecentMovements(limit = 10) {
    return prisma.stockMovement.findMany({
      take: limit,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
