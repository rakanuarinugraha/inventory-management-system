import { Router } from "express";
import { StockOpnameController } from "./stock-opname.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

// List all opnames — any authenticated user
router.get("/", StockOpnameController.getAll);

// Get single opname — any authenticated user
router.get("/:id", StockOpnameController.getById);

// Create opname — STAFF, MANAGER, or ADMIN
router.post(
  "/",
  authorize("STAFF", "MANAGER", "ADMIN"),
  StockOpnameController.create
);

// Approve or reject opname — only MANAGER or ADMIN
router.patch(
  "/:id/status",
  authorize("MANAGER", "ADMIN"),
  StockOpnameController.updateStatus
);

export default router;
