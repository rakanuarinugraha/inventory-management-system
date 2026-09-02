import { Router } from "express";
import { SupplierController } from "./supplier.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", SupplierController.getAll);
router.get("/:id", SupplierController.getById);

// ADMIN or MANAGER can create/update suppliers
router.post("/", authorize("ADMIN", "MANAGER"), SupplierController.create);
router.put("/:id", authorize("ADMIN", "MANAGER"), SupplierController.update);

// Soft-delete: deactivate / reactivate
router.patch("/:id/deactivate", authorize("ADMIN"), SupplierController.deactivate);
router.patch("/:id/reactivate", authorize("ADMIN"), SupplierController.reactivate);

export default router;
