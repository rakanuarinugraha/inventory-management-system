import prisma from "../../lib/prisma";
import { CreatePurchaseOrderInput } from "./purchase-order.schema";

export class PurchaseOrderRepository {
  async findAll() {
    return prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: { include: { product: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async create(data: CreatePurchaseOrderInput, createdBy: string) {
    return prisma.purchaseOrder.create({
      data: {
        supplierId: data.supplierId,
        createdBy,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            qtyOrdered: item.qtyOrdered,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });
  }

  async updateStatus(
    id: string,
    status: "DRAFT" | "SUBMITTED" | "PARTIALLY_RECEIVED" | "COMPLETED" | "CANCELLED"
  ) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });
  }

  async updateItemQtyReceived(itemId: string, qtyReceived: number) {
    return prisma.purchaseOrderItem.update({
      where: { id: itemId },
      data: { qtyReceived },
    });
  }
}
