import prisma from "../../lib/prisma";
import { stockCalculator } from "../../lib/stock-calculator";

export class DashboardRepository {
  async getTotalInventoryValue() {
    const stockByProduct = await stockCalculator.getAllStockByProduct();

    const productIds = [...stockByProduct.entries()]
      .filter(([, qty]) => qty > 0)
      .map(([id]) => id);

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
      const qty = stockByProduct.get(productId) ?? 0;
      const price = priceMap[productId] || 0;
      totalValue += qty * price;
    }

    return { totalValue, productCount: productIds.length };
  }

  async getLowStockCount() {
    const stockByProduct = await stockCalculator.getAllStockByProduct();

    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, reorderPoint: true },
    });

    const lowStockCount = products.filter(
      (p) => (stockByProduct.get(p.id) ?? 0) <= p.reorderPoint
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
