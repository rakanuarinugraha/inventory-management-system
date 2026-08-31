import { Request, Response, NextFunction } from "express";
import { ReportService } from "./report.service";
import { stockMovementReportQuerySchema } from "./report.schema";

const service = new ReportService();

export class ReportController {
  static async getMovingItemsReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const filters = stockMovementReportQuerySchema.parse(req.query);
      const report = await service.getMovingItemsReport(filters);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}
