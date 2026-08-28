import { CategoryRepository } from "./category.repository";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.schema";

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class CategoryService {
  private repo = new CategoryRepository();

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: string) {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    return category;
  }

  async create(data: CreateCategoryInput) {
    if (data.parentId) {
      const parent = await this.repo.findById(data.parentId);
      if (!parent) {
        throw new AppError("Parent category not found", 404);
      }
    }

    const existing = await this.repo.findByName(data.name);
    if (existing) {
      throw new AppError("Category name already exists", 409);
    }

    return this.repo.create(data);
  }

  async update(id: string, data: UpdateCategoryInput) {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new AppError("Category cannot be its own parent", 400);
      }
      if (data.parentId) {
        const parent = await this.repo.findById(data.parentId);
        if (!parent) {
          throw new AppError("Parent category not found", 404);
        }
      }
    }

    if (data.name) {
      const existing = await this.repo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new AppError("Category name already exists", 409);
      }
    }

    return this.repo.update(id, data);
  }

  async delete(id: string) {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    const hasProducts = await this.repo.hasProducts(id);
    if (hasProducts) {
      throw new AppError("Cannot delete category with associated products", 400);
    }

    const hasChildren = await this.repo.hasChildren(id);
    if (hasChildren) {
      throw new AppError("Cannot delete category with child categories", 400);
    }

    return this.repo.delete(id);
  }
}
