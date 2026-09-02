import { Request, Response, NextFunction } from "express";
import { SupplierService } from "./supplier.service";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./supplier.schema";
import { SupplierStatusFilter } from "./supplier.repository";

const service = new SupplierService();

const VALID_STATUSES: SupplierStatusFilter[] = ["active", "inactive", "all"];

export class SupplierController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const status = (req.query.status as string) || "active";
      if (!VALID_STATUSES.includes(status as SupplierStatusFilter)) {
        res.status(400).json({
          message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(", ")}`,
        });
        return;
      }
      const suppliers = await service.getAll(status as SupplierStatusFilter);
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

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const supplier = await service.deactivate(id);
      res.json({ message: "Supplier deactivated successfully", supplier });
    } catch (error) {
      next(error);
    }
  }

  static async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const supplier = await service.reactivate(id);
      res.json({ message: "Supplier reactivated successfully", supplier });
    } catch (error) {
      next(error);
    }
  }
}
