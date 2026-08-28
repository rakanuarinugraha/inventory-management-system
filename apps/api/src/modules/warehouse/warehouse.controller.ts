import { Request, Response, NextFunction } from "express";
import { WarehouseService } from "./warehouse.service";
import {
  createWarehouseSchema,
  updateWarehouseSchema,
} from "./warehouse.schema";

const service = new WarehouseService();

export class WarehouseController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const warehouses = await service.getAll();
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

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.json({ message: "Warehouse deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
