import { SupplierRepository, SupplierStatusFilter } from "./supplier.repository";
import { CreateSupplierInput, UpdateSupplierInput } from "./supplier.schema";

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class SupplierService {
  private repo = new SupplierRepository();

  async getAll(status: SupplierStatusFilter = "active") {
    return this.repo.findAll(status);
  }

  async getById(id: string) {
    const supplier = await this.repo.findById(id);
    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }
    return supplier;
  }

  async create(data: CreateSupplierInput) {
    const existing = await this.repo.findByName(data.name);
    if (existing) {
      throw new AppError("Supplier name already exists", 409);
    }

    return this.repo.create(data);
  }

  async update(id: string, data: UpdateSupplierInput) {
    const supplier = await this.repo.findById(id);
    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    if (data.name) {
      const existing = await this.repo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new AppError("Supplier name already exists", 409);
      }
    }

    return this.repo.update(id, data);
  }

  async deactivate(id: string) {
    const supplier = await this.repo.findById(id);
    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }
    if (!supplier.isActive) {
      throw new AppError("Supplier is already inactive", 400);
    }
    return this.repo.deactivate(id);
  }

  async reactivate(id: string) {
    const supplier = await this.repo.findById(id);
    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }
    if (supplier.isActive) {
      throw new AppError("Supplier is already active", 400);
    }
    return this.repo.reactivate(id);
  }
}
