import { WarehouseRepository, WarehouseStatusFilter } from "./warehouse.repository";
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

  async getAll(status: WarehouseStatusFilter = "active") {
    return this.repo.findAll(status);
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

  async deactivate(id: string) {
    const warehouse = await this.repo.findById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
    if (!warehouse.isActive) {
      throw new AppError("Warehouse is already inactive", 400);
    }
    return this.repo.deactivate(id);
  }

  async reactivate(id: string) {
    const warehouse = await this.repo.findById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
    if (warehouse.isActive) {
      throw new AppError("Warehouse is already active", 400);
    }
    return this.repo.reactivate(id);
  }
}
