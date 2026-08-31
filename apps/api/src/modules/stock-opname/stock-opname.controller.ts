import { Request, Response, NextFunction } from "express";
import { StockOpnameService } from "./stock-opname.service";
import {
  createOpnameSchema,
  approveOpnameSchema,
} from "./stock-opname.schema";

const service = new StockOpnameService();

export class StockOpnameController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const opnames = await service.getAll();
      res.json({ opnames });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const opname = await service.getById(id);
      res.json({ opname });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOpnameSchema.parse(req.body);
      const createdBy = req.user!.userId;
      const opname = await service.create(data, createdBy);
      res
        .status(201)
        .json({ message: "Stock opname created successfully", opname });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = approveOpnameSchema.parse(req.body);
      const opname = await service.updateStatus(id, data);
      res.json({
        message: `Stock opname ${data.status.toLowerCase()} successfully`,
        opname,
      });
    } catch (error) {
      next(error);
    }
  }
}
