import { Request, Response, NextFunction } from "express";
import { WarehouseService } from "./warehouse.service";
import {
  createWarehouseSchema,
  updateWarehouseSchema,
} from "./warehouse.schema";
import { WarehouseStatusFilter } from "./warehouse.repository";

const service = new WarehouseService();

const VALID_STATUSES: WarehouseStatusFilter[] = ["active", "inactive", "all"];

export class WarehouseController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const status = (req.query.status as string) || "active";
      if (!VALID_STATUSES.includes(status as WarehouseStatusFilter)) {
        res.status(400).json({
          message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(", ")}`,
        });
        return;
      }
      const warehouses = await service.getAll(status as WarehouseStatusFilter);
      res.json({ warehouses });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const warehouse = await service.getById(id);
      res.json({ warehouse });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createWarehouseSchema.parse(req.body);
      const warehouse = await service.create(data);
      res
        .status(201)
        .json({ message: "Warehouse created successfully", warehouse });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateWarehouseSchema.parse(req.body);
      const warehouse = await service.update(id, data);
      res.json({ message: "Warehouse updated successfully", warehouse });
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const warehouse = await service.deactivate(id);
      res.json({ message: "Warehouse deactivated successfully", warehouse });
    } catch (error) {
      next(error);
    }
  }

  static async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const warehouse = await service.reactivate(id);
      res.json({ message: "Warehouse reactivated successfully", warehouse });
    } catch (error) {
      next(error);
    }
  }
}
