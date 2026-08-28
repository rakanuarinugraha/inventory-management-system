import prisma from "../../lib/prisma";
import { CreateSupplierInput, UpdateSupplierInput } from "./supplier.schema";

export class SupplierRepository {
  async findAll() {
    return prisma.supplier.findMany({
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

  async delete(id: string) {
    return prisma.supplier.delete({ where: { id } });
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
