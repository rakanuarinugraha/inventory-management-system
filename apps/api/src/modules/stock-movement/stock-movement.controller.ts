import { Request, Response, NextFunction } from "express";
import { StockMovementService } from "./stock-movement.service";
import {
  stockInSchema,
  stockOutSchema,
  transferSchema,
  movementHistoryQuerySchema,
  allMovementsQuerySchema,
} from "./stock-movement.schema";

const service = new StockMovementService();

export class StockMovementController {
  static async stockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const data = stockInSchema.parse(req.body);
      const createdBy = req.user!.userId;
      const movement = await service.stockIn(data, createdBy);
      res
        .status(201)
        .json({ message: "Stock received successfully", movement });
    } catch (error) {
      next(error);
    }
  }

  static async stockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const data = stockOutSchema.parse(req.body);
      const createdBy = req.user!.userId;
      const { movement, warning } = await service.stockOut(data, createdBy);
      res.status(201).json({
        message: "Stock out recorded successfully",
        movement,
        warning: warning || null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = transferSchema.parse(req.body);
      const createdBy = req.user!.userId;
      const movements = await service.transfer(data, createdBy);
      res.status(201).json({
        message: "Stock transferred successfully",
        movements,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentStock(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.query.productId as string;
      const warehouseId = req.query.warehouseId as string;

      if (!productId || !warehouseId) {
        res
          .status(400)
          .json({ message: "productId and warehouseId are required" });
        return;
      }

      const currentStock = await service.getCurrentStock(productId, warehouseId);
      res.json({ productId, warehouseId, currentStock });
    } catch (error) {
      next(error);
    }
  }

  static async getMovementsByPo(req: Request, res: Response, next: NextFunction) {
    try {
      const poId = req.params.poId as string;
      const movements = await service.getMovementsByPoId(poId);
      res.json({ movements });
    } catch (error) {
      next(error);
    }
  }

  static async getAllMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = allMovementsQuerySchema.parse(req.query);
      const result = await service.getAllMovements(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMovementHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const filters = movementHistoryQuerySchema.parse(req.query);
      const result = await service.getMovementHistory(productId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
