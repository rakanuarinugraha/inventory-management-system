import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateUserSchema,
} from "./auth.schema";

const service = new AuthService();

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const user = await service.register(data);
      res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await service.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const result = await service.refreshAccessToken(refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      await service.logout(refreshToken);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await service.getAllUsers();
      res.json({ users });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const user = await service.getUserById(id);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateUserSchema.parse(req.body);
      const user = await service.updateUser(id, data);
      res.json({ message: "User updated successfully", user });
    } catch (error) {
      next(error);
    }
  }

  static async deactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const user = await service.deactivateUser(id);
      res.json({ message: "User deactivated successfully", user });
    } catch (error) {
      next(error);
    }
  }
}
