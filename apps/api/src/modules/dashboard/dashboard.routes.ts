import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/summary", authorize("ADMIN", "MANAGER"), DashboardController.getSummary);
router.post("/refresh", authorize("ADMIN", "MANAGER"), DashboardController.refresh);

export default router;
