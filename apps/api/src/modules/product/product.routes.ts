import { Router } from "express";
import { ProductController } from "./product.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getById);

// Admin-only routes
router.post("/", authorize("ADMIN"), ProductController.create);
router.put("/:id", authorize("ADMIN"), ProductController.update);
router.delete("/:id", authorize("ADMIN"), ProductController.delete);

export default router;
