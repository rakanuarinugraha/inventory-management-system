import { Router } from "express";
import { WarehouseController } from "./warehouse.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", WarehouseController.getAll);
router.get("/:id", WarehouseController.getById);

// Admin-only routes
router.post("/", authorize("ADMIN"), WarehouseController.create);
router.put("/:id", authorize("ADMIN"), WarehouseController.update);

// Soft-delete: deactivate / reactivate
router.patch("/:id/deactivate", authorize("ADMIN"), WarehouseController.deactivate);
router.patch("/:id/reactivate", authorize("ADMIN"), WarehouseController.reactivate);

export default router;
