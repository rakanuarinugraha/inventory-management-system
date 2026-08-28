import { Request, Response, NextFunction } from "express";
import { SupplierService } from "./supplier.service";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./supplier.schema";

const service = new SupplierService();

export class SupplierController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await service.getAll();
      res.json({ suppliers });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const supplier = await service.getById(id);
      res.json({ supplier });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSupplierSchema.parse(req.body);
      const supplier = await service.create(data);
      res
        .status(201)
        .json({ message: "Supplier created successfully", supplier });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateSupplierSchema.parse(req.body);
      const supplier = await service.update(id, data);
      res.json({ message: "Supplier updated successfully", supplier });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
