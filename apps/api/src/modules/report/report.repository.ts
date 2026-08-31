import prisma from "../../lib/prisma";
import { StockMovementReportQuery } from "./report.schema";

interface ProductMovementAgg {
  productId: string;
  productName: string;
  productSku: string;
  categoryName: string;
  totalQuantityOut: number;
  movementCount: number;
}

export class ReportRepository {
  async getOutboundMovements(
    filters: StockMovementReportQuery
  ): Promise<ProductMovementAgg[]> {
    const dateFrom = new Date(filters.date_from);
    const dateTo = new Date(filters.date_to);

    const where: Record<string, unknown> = {
      type: "OUT",
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    const results = await prisma.stockMovement.groupBy({
      by: ["productId"],
      where,
      _sum: { quantity: true },
      _count: { id: true },
    });

    if (results.length === 0) {
      return [];
    }

    const productIds = results.map((r) => r.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: { select: { name: true } } },
    });

    const productMap = new Map(
      products.map((p) => [p.id, { name: p.name, sku: p.sku, category: p.category.name }])
    );

    return results.map((r) => {
      const info = productMap.get(r.productId);
      return {
        productId: r.productId,
        productName: info?.name ?? "Unknown",
        productSku: info?.sku ?? "Unknown",
        categoryName: info?.category ?? "Uncategorized",
        totalQuantityOut: r._sum.quantity ?? 0,
        movementCount: r._count.id,
      };
    });
  }
}
