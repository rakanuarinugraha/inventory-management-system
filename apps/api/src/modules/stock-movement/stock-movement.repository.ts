import prisma from "../../lib/prisma";
import {
  StockInInput,
  StockOutInput,
  TransferInput,
  MovementHistoryQuery,
} from "./stock-movement.schema";

export class StockMovementRepository {
  async createStockIn(data: StockInInput, createdBy: string) {
    return prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          type: "IN",
          quantity: data.quantity,
          referenceType: "PURCHASE_ORDER",
          referenceId: data.poId,
          note: data.note,
          createdBy,
        },
        include: {
          product: true,
          warehouse: true,
          creator: { select: { id: true, name: true } },
        },
      });

      // Update PO item qty_received
      const poItem = await tx.purchaseOrderItem.findFirst({
        where: {
          poId: data.poId,
          productId: data.productId,
        },
      });

      if (poItem) {
        const newQtyReceived = poItem.qtyReceived + data.quantity;
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { qtyReceived: newQtyReceived },
        });

        // Check if all items are fully received to update PO status
        const po = await tx.purchaseOrder.findUnique({
          where: { id: data.poId },
          include: { items: true },
        });

        if (po) {
          const allFullyReceived = po.items.every(
            (item) => item.qtyReceived >= item.qtyOrdered
          );
          const anyPartiallyReceived = po.items.some(
            (item) => item.qtyReceived > 0 && item.qtyReceived < item.qtyOrdered
          );

          if (allFullyReceived) {
            await tx.purchaseOrder.update({
              where: { id: data.poId },
              data: { status: "COMPLETED" },
            });
          } else if (anyPartiallyReceived) {
            await tx.purchaseOrder.update({
              where: { id: data.poId },
              data: { status: "PARTIALLY_RECEIVED" },
            });
          }
        }
      }

      return movement;
    });
  }

  async createStockOut(data: StockOutInput, createdBy: string) {
    return prisma.stockMovement.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        type: "OUT",
        quantity: data.quantity,
        referenceType: "MANUAL",
        note: data.note,
        createdBy,
      },
      include: {
        product: true,
        warehouse: true,
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async createTransfer(data: TransferInput, createdBy: string) {
    return prisma.$transaction(async (tx) => {
      const transferOut = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          warehouseId: data.sourceWarehouseId,
          type: "TRANSFER_OUT",
          quantity: data.quantity,
          referenceType: "TRANSFER",
          note: data.note
            ? `${data.note} — Transfer out to ${data.destinationWarehouseId}`
            : `Transfer out to ${data.destinationWarehouseId}`,
          createdBy,
        },
        include: {
          product: true,
          warehouse: true,
          creator: { select: { id: true, name: true } },
        },
      });

      const transferIn = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          warehouseId: data.destinationWarehouseId,
          type: "TRANSFER_IN",
          quantity: data.quantity,
          referenceType: "TRANSFER",
          note: data.note
            ? `${data.note} — Transfer in from ${data.sourceWarehouseId}`
            : `Transfer in from ${data.sourceWarehouseId}`,
          createdBy,
        },
        include: {
          product: true,
          warehouse: true,
          creator: { select: { id: true, name: true } },
        },
      });

      return { transferOut, transferIn };
    });
  }

  async getCurrentStock(productId: string, warehouseId: string) {
    const result = await prisma.stockMovement.aggregate({
      where: {
        productId,
        warehouseId,
        type: { in: ["IN", "TRANSFER_IN", "ADJUSTMENT_IN"] },
      },
      _sum: { quantity: true },
    });

    const outbound = await prisma.stockMovement.aggregate({
      where: {
        productId,
        warehouseId,
        type: { in: ["OUT", "TRANSFER_OUT", "ADJUSTMENT_OUT"] },
      },
      _sum: { quantity: true },
    });

    const incoming = result._sum.quantity ?? 0;
    const outgoing = outbound._sum.quantity ?? 0;

    return incoming - outgoing;
  }

  async getStockByProductAndWarehouse(productId: string) {
    const movements = await prisma.stockMovement.groupBy({
      by: ["warehouseId", "type"],
      where: { productId },
      _sum: { quantity: true },
    });

    const stock: Record<string, number> = {};

    for (const m of movements) {
      const current = stock[m.warehouseId] || 0;
      if (
        m.type === "IN" ||
        m.type === "TRANSFER_IN" ||
        m.type === "ADJUSTMENT_IN"
      ) {
        stock[m.warehouseId] = current + (m._sum.quantity ?? 0);
      } else {
        stock[m.warehouseId] = current - (m._sum.quantity ?? 0);
      }
    }

    return stock;
  }

  async findHistoryByProduct(productId: string, filters: MovementHistoryQuery) {
    const { date_from, date_to, warehouseId, type, createdBy, page, limit } =
      filters;

    const where: Record<string, unknown> = { productId };

    if (date_from || date_to) {
      where.createdAt = {
        ...(date_from && { gte: new Date(date_from) }),
        ...(date_to && { lte: new Date(date_to) }),
      };
    }
    if (warehouseId) where.warehouseId = warehouseId;
    if (type) where.type = type;
    if (createdBy) where.createdBy = createdBy;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: true,
          warehouse: true,
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByPoId(poId: string) {
    return prisma.stockMovement.findMany({
      where: { referenceType: "PURCHASE_ORDER", referenceId: poId },
      include: {
        product: true,
        warehouse: true,
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
