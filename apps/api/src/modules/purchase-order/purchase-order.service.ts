import { PurchaseOrderRepository } from "./purchase-order.repository";
import {
  CreatePurchaseOrderInput,
  TransitionPOStatusInput,
} from "./purchase-order.schema";

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class PurchaseOrderService {
  private repo = new PurchaseOrderRepository();

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: string) {
    const po = await this.repo.findById(id);
    if (!po) {
      throw new AppError("Purchase order not found", 404);
    }
    return po;
  }

  async create(data: CreatePurchaseOrderInput, createdBy: string) {
    return this.repo.create(data, createdBy);
  }

  async transitionStatus(id: string, data: TransitionPOStatusInput) {
    const po = await this.repo.findById(id);
    if (!po) {
      throw new AppError("Purchase order not found", 404);
    }

    // Validate allowed transitions
    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ["SUBMITTED", "CANCELLED"],
      SUBMITTED: ["CANCELLED"],
      PARTIALLY_RECEIVED: ["CANCELLED"],
    };

    const allowed = allowedTransitions[po.status];
    if (!allowed || !allowed.includes(data.status)) {
      throw new AppError(
        `Cannot transition PO from ${po.status} to ${data.status}`,
        400
      );
    }

    return this.repo.updateStatus(id, data.status);
  }
}
