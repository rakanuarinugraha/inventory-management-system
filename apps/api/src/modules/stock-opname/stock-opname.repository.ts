import prisma from "../../lib/prisma";
import { CreateOpnameInput } from "./stock-opname.schema";

export class StockOpnameRepository {
  async findAll() {
    return prisma.stockOpname.findMany({
      include: {
        warehouse: true,
        items: { include: { product: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.stockOpname.findUnique({
      where: { id },
      include: {
        warehouse: true,
        items: { include: { product: true } },
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async create(
    data: CreateOpnameInput,
    systemQtyMap: Record<string, number>,
    createdBy: string
  ) {
    return prisma.stockOpname.create({
      data: {
        warehouseId: data.warehouseId,
        createdBy,
        items: {
          create: data.items.map((item) => {
            const systemQty = systemQtyMap[item.productId] ?? 0;
            return {
              productId: item.productId,
              systemQty,
              actualQty: item.actualQty,
              variance: item.actualQty - systemQty,
            };
          }),
        },
      },
      include: {
        warehouse: true,
        items: { include: { product: true } },
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async approve(id: string, approvedBy: string) {
    return prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!opname) throw new Error("Stock opname not found");

      // Create adjustment movements for each item with a non-zero variance
      for (const item of opname.items) {
        if (item.variance === 0) continue;

        const isPositive = item.variance > 0;
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: opname.warehouseId,
            type: isPositive ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
            quantity: Math.abs(item.variance),
            referenceType: "STOCK_OPNAME",
            referenceId: id,
            note: `Stock opname adjustment — variance: ${item.variance > 0 ? "+" : ""}${item.variance}`,
            createdBy: approvedBy,
          },
        });
      }

      // Update opname status
      return tx.stockOpname.update({
        where: { id },
        data: { status: "APPROVED" },
        include: {
          warehouse: true,
          items: { include: { product: true } },
          creator: { select: { id: true, name: true } },
        },
      });
    });
  }

  async reject(id: string) {
    return prisma.stockOpname.update({
      where: { id },
      data: { status: "REJECTED" },
      include: {
        warehouse: true,
        items: { include: { product: true } },
        creator: { select: { id: true, name: true } },
      },
    });
  }
}
