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

  static async exportStockReportCsv(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const csv = await service.getStockExportCsv();
      const timestamp = new Date().toISOString().split("T")[0];
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="stock-report-${timestamp}.csv"`
      );
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}
