import { Request, Response, NextFunction } from "express";
import { CategoryService } from "./category.service";
import { createCategorySchema, updateCategorySchema } from "./category.schema";

const service = new CategoryService();

export class CategoryController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await service.getAll();
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const category = await service.getById(id);
      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await service.create(data);
      res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateCategorySchema.parse(req.body);
      const category = await service.update(id, data);
      res.json({ message: "Category updated successfully", category });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
