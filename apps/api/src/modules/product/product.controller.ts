import { Request, Response, NextFunction } from "express";
import { ProductService } from "./product.service";
import { createProductSchema, updateProductSchema } from "./product.schema";

const service = new ProductService();

export class ProductController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await service.getAll();
      res.json({ products });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const product = await service.getById(id);
      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await service.create(data);
      res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateProductSchema.parse(req.body);
      const product = await service.update(id, data);
      res.json({ message: "Product updated successfully", product });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await service.softDelete(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
