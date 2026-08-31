import { Router } from "express";
import { ReportController } from "./report.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/moving-items",
  authorize("ADMIN", "MANAGER"),
  ReportController.getMovingItemsReport
);

router.get(
  "/stock-export",
  authorize("ADMIN"),
  ReportController.exportStockReportCsv
);

router.get(
  "/stock-export/excel",
  authorize("ADMIN"),
  ReportController.exportStockReportExcel
);

export default router;
