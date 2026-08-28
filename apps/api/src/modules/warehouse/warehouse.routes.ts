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
router.delete("/:id", authorize("ADMIN"), WarehouseController.delete);

export default router;
