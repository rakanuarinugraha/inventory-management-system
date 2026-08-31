import prisma from "../../lib/prisma";
import { stockCalculator } from "../../lib/stock-calculator";
import { StockMovementReportQuery } from "./report.schema";

interface ProductMovementAgg {
  productId: string;
  productName: string;
  productSku: string;
  categoryName: string;
  totalQuantityOut: number;
  movementCount: number;
}

interface StockExportRow {
  sku: string;
  productName: string;
  category: string;
  warehouse: string;
  currentStock: number;
  unit: string;
  reorderPoint: number;
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

    // For categoryId, we need to filter by product's category
    // Since groupBy is on productId, we first get matching product IDs
    let categoryProductIds: string[] | undefined;
    if (filters.categoryId) {
      const categoryProducts = await prisma.product.findMany({
        where: { categoryId: filters.categoryId },
        select: { id: true },
      });
      categoryProductIds = categoryProducts.map((p) => p.id);
      if (categoryProductIds.length === 0) {
        return [];
      }
      where.productId = { in: categoryProductIds };
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

  async getStockExportData(): Promise<StockExportRow[]> {
    const stockMap = await stockCalculator.getAllStockByProductWarehouse();

    if (stockMap.size === 0) {
      return [];
    }

    // Collect unique product and warehouse IDs
    const productIds = new Set<string>();
    const warehouseIds = new Set<string>();

    for (const key of stockMap.keys()) {
      const [productId, warehouseId] = key.split(":");
      productIds.add(productId);
      warehouseIds.add(warehouseId);
    }

    const [products, warehouses] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: [...productIds] } },
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
          reorderPoint: true,
          category: { select: { name: true } },
        },
      }),
      prisma.warehouse.findMany({
        where: { id: { in: [...warehouseIds] } },
        select: { id: true, name: true },
      }),
    ]);

    const productMap = new Map(
      products.map((p) => [
        p.id,
        {
          sku: p.sku,
          name: p.name,
          unit: p.unit,
          reorderPoint: p.reorderPoint,
          category: p.category.name,
        },
      ])
    );

    const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));

    const rows: StockExportRow[] = [];

    for (const [key, qty] of stockMap.entries()) {
      const [productId, warehouseId] = key.split(":");
      const product = productMap.get(productId);
      const warehouse = warehouseMap.get(warehouseId);

      if (product && warehouse) {
        rows.push({
          sku: product.sku,
          productName: product.name,
          category: product.category,
          warehouse,
          currentStock: qty,
          unit: product.unit,
          reorderPoint: product.reorderPoint,
        });
      }
    }

    rows.sort((a, b) => a.sku.localeCompare(b.sku));

    return rows;
  }
}
