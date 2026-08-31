import { Router } from "express";
import { PurchaseOrderController } from "./purchase-order.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", PurchaseOrderController.getAll);
router.get("/:id", PurchaseOrderController.getById);

// Only MANAGER or ADMIN can create POs
router.post(
  "/",
  authorize("ADMIN", "MANAGER"),
  PurchaseOrderController.create
);

// Only MANAGER or ADMIN can transition PO status
router.patch(
  "/:id/status",
  authorize("ADMIN", "MANAGER"),
  PurchaseOrderController.transitionStatus
);

export default router;
