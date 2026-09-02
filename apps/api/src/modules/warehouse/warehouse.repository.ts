import prisma from "../../lib/prisma";
import { CreateWarehouseInput, UpdateWarehouseInput } from "./warehouse.schema";

export type WarehouseStatusFilter = "active" | "inactive" | "all";

export class WarehouseRepository {
  async findAll(status: WarehouseStatusFilter = "active") {
    const where =
      status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {};
    return prisma.warehouse.findMany({
      where,
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

  async deactivate(id: string) {
    return prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reactivate(id: string) {
    return prisma.warehouse.update({
      where: { id },
      data: { isActive: true },
    });
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
