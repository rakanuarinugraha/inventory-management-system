import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

// Public routes
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refreshToken);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

// Protected routes - any authenticated user
router.post("/logout", authenticate, AuthController.logout);
router.get("/me", authenticate, AuthController.getUserById);

// Admin-only routes
router.post("/register", authenticate, authorize("ADMIN"), AuthController.register);
router.get("/users", authenticate, authorize("ADMIN"), AuthController.getAllUsers);
router.put("/users/:id", authenticate, authorize("ADMIN"), AuthController.updateUser);
router.patch("/users/:id/deactivate", authenticate, authorize("ADMIN"), AuthController.deactivateUser);

export default router;
