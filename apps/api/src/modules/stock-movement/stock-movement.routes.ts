import { Router } from "express";
import { StockMovementController } from "./stock-movement.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

// All stock movements (paginated, filterable) — for movement history page
router.get("/", StockMovementController.getAllMovements);

// Stock in — STAFF, MANAGER, or ADMIN
router.post(
  "/stock-in",
  authorize("STAFF", "MANAGER", "ADMIN"),
  StockMovementController.stockIn
);

// Stock out — STAFF, MANAGER, or ADMIN
router.post(
  "/stock-out",
  authorize("STAFF", "MANAGER", "ADMIN"),
  StockMovementController.stockOut
);

// Transfer stock between warehouses — STAFF, MANAGER, or ADMIN
router.post(
  "/transfer",
  authorize("STAFF", "MANAGER", "ADMIN"),
  StockMovementController.transfer
);

// Current stock check
router.get("/current-stock", StockMovementController.getCurrentStock);

// Movements by PO
router.get("/po/:poId", StockMovementController.getMovementsByPo);

// Movement history per product (append-only logs, filterable)
router.get(
  "/product/:productId",
  StockMovementController.getMovementHistory
);

export default router;
