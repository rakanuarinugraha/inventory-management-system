import prisma from "../../lib/prisma";
import { CreateProductInput, UpdateProductInput } from "./product.schema";

export class ProductRepository {
  async findAll() {
    return prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async create(data: CreateProductInput) {
    return prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        categoryId: data.categoryId,
        unit: data.unit,
        reorderPoint: data.reorderPoint,
      },
      include: { category: true },
    });
  }

  async update(id: string, data: UpdateProductInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async softDelete(id: string) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findBySku(sku: string) {
    return prisma.product.findFirst({ where: { sku } });
  }

  async hasMovements(id: string) {
    const count = await prisma.stockMovement.count({ where: { productId: id } });
    return count > 0;
  }

  async findSuggestedReorder() {
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
      include: { category: true },
      orderBy: { name: "asc" },
    });

    return products
      .filter((p) => (stockMap[p.id] || 0) <= p.reorderPoint)
      .map((p) => ({
        ...p,
        currentStock: stockMap[p.id] || 0,
      }));
  }
}
