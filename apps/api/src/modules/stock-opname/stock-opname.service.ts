import { StockOpnameRepository } from "./stock-opname.repository";
import { StockMovementRepository } from "../stock-movement/stock-movement.repository";
import { lowStockAlertQueue } from "../../lib/queue";
import {
  CreateOpnameInput,
  ApproveOpnameInput,
} from "./stock-opname.schema";
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

export class StockOpnameService {
  private repo = new StockOpnameRepository();
  private movementRepo = new StockMovementRepository();

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: string) {
    const opname = await this.repo.findById(id);
    if (!opname) {
      throw new AppError("Stock opname not found", 404);
    }
    return opname;
  }

  async create(data: CreateOpnameInput, createdBy: string) {
    // Validate warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
    });
    if (!warehouse || !warehouse.isActive) {
      throw new AppError("Warehouse not found or inactive", 404);
    }

    // Validate all products exist and are active
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });
    if (products.length !== productIds.length) {
      throw new AppError("One or more products not found or inactive", 400);
    }

    // Compute current stock for each product in this warehouse
    const systemQtyMap: Record<string, number> = {};
    for (const productId of productIds) {
      systemQtyMap[productId] = await this.movementRepo.getCurrentStock(
        productId,
        data.warehouseId
      );
    }

    return this.repo.create(data, systemQtyMap, createdBy);
  }

  async updateStatus(id: string, data: ApproveOpnameInput) {
    const opname = await this.repo.findById(id);
    if (!opname) {
      throw new AppError("Stock opname not found", 404);
    }
    if (opname.status !== "PENDING") {
      throw new AppError(
        `Cannot ${data.status.toLowerCase()} an opname with status ${opname.status}`,
        400
      );
    }

    if (data.status === "APPROVED") {
      const result = await this.repo.approve(id, opname.createdBy);

      // Enqueue low-stock check for items with negative variance (ADJUSTMENT_OUT)
      for (const item of opname.items) {
        if (item.variance < 0) {
          lowStockAlertQueue.add(
            "check-low-stock",
            { productId: item.productId, warehouseId: opname.warehouseId },
            { jobId: `low-stock-${item.productId}-${opname.warehouseId}-${Date.now()}` }
          );
        }
      }

      return result;
    }
    return this.repo.reject(id);
  }
}
