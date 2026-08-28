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
}
