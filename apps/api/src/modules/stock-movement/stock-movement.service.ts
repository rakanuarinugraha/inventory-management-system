import { StockMovementRepository } from "./stock-movement.repository";
import { PurchaseOrderRepository } from "../purchase-order/purchase-order.repository";
import {
  StockInInput,
  StockOutInput,
  TransferInput,
  MovementHistoryQuery,
} from "./stock-movement.schema";
import prisma from "../../lib/prisma";

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class StockMovementService {
  private repo = new StockMovementRepository();
  private poRepo = new PurchaseOrderRepository();

  async stockIn(data: StockInInput, createdBy: string) {
    // Validate PO exists and is not completed/cancelled
    const po = await this.poRepo.findById(data.poId);
    if (!po) {
      throw new AppError("Purchase order not found", 404);
    }
    if (po.status === "COMPLETED" || po.status === "CANCELLED") {
      throw new AppError(
        "Cannot receive goods against a completed or cancelled PO",
        400
      );
    }

    // Validate the product is in the PO items
    const poItem = po.items.find((item) => item.productId === data.productId);
    if (!poItem) {
      throw new AppError(
        "Product not found in this purchase order",
        400
      );
    }

    // Validate received qty doesn't exceed remaining ordered qty
    const remaining = poItem.qtyOrdered - poItem.qtyReceived;
    if (data.quantity > remaining) {
      throw new AppError(
        `Received quantity (${data.quantity}) exceeds remaining ordered quantity (${remaining})`,
        400
      );
    }

    return this.repo.createStockIn(data, createdBy);
  }

  async stockOut(data: StockOutInput, createdBy: string) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product || !product.isActive) {
      throw new AppError("Product not found or inactive", 404);
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
    });
    if (!warehouse || !warehouse.isActive) {
      throw new AppError("Warehouse not found or inactive", 404);
    }

    const currentStock = await this.repo.getCurrentStock(
      data.productId,
      data.warehouseId
    );
    if (currentStock < data.quantity) {
      throw new AppError(
        `Insufficient stock. Available: ${currentStock}, requested: ${data.quantity}`,
        400
      );
    }

    const movement = await this.repo.createStockOut(data, createdBy);

    const resultingStock = currentStock - data.quantity;
    const warning =
      resultingStock < product.reorderPoint
        ? `Low stock warning: resulting stock (${resultingStock}) is below reorder point (${product.reorderPoint})`
        : undefined;

    return { movement, warning };
  }

  async transfer(data: TransferInput, createdBy: string) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product || !product.isActive) {
      throw new AppError("Product not found or inactive", 404);
    }

    const sourceWarehouse = await prisma.warehouse.findUnique({
      where: { id: data.sourceWarehouseId },
    });
    if (!sourceWarehouse || !sourceWarehouse.isActive) {
      throw new AppError("Source warehouse not found or inactive", 404);
    }

    const destWarehouse = await prisma.warehouse.findUnique({
      where: { id: data.destinationWarehouseId },
    });
    if (!destWarehouse || !destWarehouse.isActive) {
      throw new AppError("Destination warehouse not found or inactive", 404);
    }

    const currentStock = await this.repo.getCurrentStock(
      data.productId,
      data.sourceWarehouseId
    );
    if (currentStock < data.quantity) {
      throw new AppError(
        `Insufficient stock at source warehouse. Available: ${currentStock}, requested: ${data.quantity}`,
        400
      );
    }

    return this.repo.createTransfer(data, createdBy);
  }

  async getCurrentStock(productId: string, warehouseId: string) {
    return this.repo.getCurrentStock(productId, warehouseId);
  }

  async getStockByProduct(productId: string) {
    return this.repo.getStockByProductAndWarehouse(productId);
  }

  async getMovementsByPoId(poId: string) {
    return this.repo.findByPoId(poId);
  }

  async getMovementHistory(productId: string, filters: MovementHistoryQuery) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    return this.repo.findHistoryByProduct(productId, filters);
  }
}
