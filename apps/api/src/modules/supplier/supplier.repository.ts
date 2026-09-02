import prisma from "../../lib/prisma";
import { CreateSupplierInput, UpdateSupplierInput } from "./supplier.schema";

export type SupplierStatusFilter = "active" | "inactive" | "all";

export class SupplierRepository {
  async findAll(status: SupplierStatusFilter = "active") {
    const where =
      status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {};
    return prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.supplier.findUnique({ where: { id } });
  }

  async create(data: CreateSupplierInput) {
    return prisma.supplier.create({ data });
  }

  async update(id: string, data: UpdateSupplierInput) {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async deactivate(id: string) {
    return prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reactivate(id: string) {
    return prisma.supplier.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async findByName(name: string) {
    return prisma.supplier.findFirst({ where: { name } });
  }

  async hasPurchaseOrders(id: string) {
    const count = await prisma.purchaseOrder.count({
      where: { supplierId: id },
    });
    return count > 0;
  }
}
