import { Request, Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service";

const service = new DashboardService();

export class DashboardController {
  static async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await service.getSummary();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  static async refresh(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await service.refreshCache();
      res.json({ message: "Dashboard cache refreshed", summary });
    } catch (error) {
      next(error);
    }
  }
}
