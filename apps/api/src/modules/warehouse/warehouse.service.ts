import { WarehouseRepository } from "./warehouse.repository";
import { CreateWarehouseInput, UpdateWarehouseInput } from "./warehouse.schema";

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class WarehouseService {
  private repo = new WarehouseRepository();

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: string) {
    const warehouse = await this.repo.findById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
    return warehouse;
  }

  async create(data: CreateWarehouseInput) {
    const existing = await this.repo.findByName(data.name);
    if (existing) {
      throw new AppError("Warehouse name already exists", 409);
    }

    return this.repo.create(data);
  }

  async update(id: string, data: UpdateWarehouseInput) {
    const warehouse = await this.repo.findById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    if (data.name) {
      const existing = await this.repo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new AppError("Warehouse name already exists", 409);
      }
    }

    return this.repo.update(id, data);
  }

  async delete(id: string) {
    const warehouse = await this.repo.findById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    const hasMovements = await this.repo.hasMovements(id);
    if (hasMovements) {
      throw new AppError(
        "Cannot delete warehouse with associated stock movements",
        400
      );
    }

    const hasOpnames = await this.repo.hasOpnames(id);
    if (hasOpnames) {
      throw new AppError(
        "Cannot delete warehouse with associated stock opnames",
        400
      );
    }

    return this.repo.delete(id);
  }
}
