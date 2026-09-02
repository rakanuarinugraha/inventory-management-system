import { Request, Response, NextFunction } from "express";
import { ProductService } from "./product.service";
import { createProductSchema, updateProductSchema } from "./product.schema";
import { ProductStatusFilter } from "./product.repository";

const service = new ProductService();

const VALID_STATUSES: ProductStatusFilter[] = ["active", "inactive", "all"];

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const status = (req.query.status as string) || "active";
      if (!VALID_STATUSES.includes(status as ProductStatusFilter)) {
        res.status(400).json({
          message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(", ")}`,
        });
        return;
      }
      const products = await service.getAll(status as ProductStatusFilter);
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

  static async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const product = await service.reactivate(id);
      res.json({ message: "Product reactivated successfully", product });
    } catch (error) {
      next(error);
    }
  }

  static async getSuggestedReorder(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await service.getSuggestedReorder();
      res.json({ products });
    } catch (error) {
      next(error);
    }
  }
}
