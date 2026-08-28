import prisma from "../../lib/prisma";
import { CreateWarehouseInput, UpdateWarehouseInput } from "./warehouse.schema";

export class WarehouseRepository {
  async findAll() {
    return prisma.warehouse.findMany({
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.warehouse.findUnique({ where: { id } });
  }

  async create(data: CreateWarehouseInput) {
    return prisma.warehouse.create({ data });
  }

  async update(id: string, data: UpdateWarehouseInput) {
    return prisma.warehouse.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.warehouse.delete({ where: { id } });
  }

  async findByName(name: string) {
    return prisma.warehouse.findFirst({ where: { name } });
  }

  async hasMovements(id: string) {
    const count = await prisma.stockMovement.count({
      where: { warehouseId: id },
    });
    return count > 0;
  }

  async hasOpnames(id: string) {
    const count = await prisma.stockOpname.count({
      where: { warehouseId: id },
    });
    return count > 0;
  }
}
