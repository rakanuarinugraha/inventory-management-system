import { Router } from "express";
import { CategoryController } from "./category.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", CategoryController.getAll);
router.get("/:id", CategoryController.getById);

// Admin-only routes
router.post("/", authorize("ADMIN"), CategoryController.create);
router.put("/:id", authorize("ADMIN"), CategoryController.update);
router.delete("/:id", authorize("ADMIN"), CategoryController.delete);

export default router;
