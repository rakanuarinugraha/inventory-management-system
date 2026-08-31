import { ProductRepository } from "./product.repository";
import { CreateProductInput, UpdateProductInput } from "./product.schema";

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ProductService {
  private repo = new ProductRepository();

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: string) {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    return product;
  }

  async create(data: CreateProductInput) {
    const existing = await this.repo.findBySku(data.sku);
    if (existing) {
      throw new AppError("SKU already exists", 409);
    }

    return this.repo.create(data);
  }

  async update(id: string, data: UpdateProductInput) {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (data.sku) {
      const existing = await this.repo.findBySku(data.sku);
      if (existing && existing.id !== id) {
        throw new AppError("SKU already exists", 409);
      }
    }

    return this.repo.update(id, data);
  }

  async softDelete(id: string) {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return this.repo.softDelete(id);
  }

  async getSuggestedReorder() {
    return this.repo.findSuggestedReorder();
  }
}
