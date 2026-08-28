import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AuthRepository } from "./auth.repository";
import { RegisterInput, UpdateUserInput } from "./auth.schema";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export class AuthService {
  private repo = new AuthRepository();

  private get jwtSecret() {
    return process.env.JWT_SECRET || "dev-secret-change-in-production";
  }

  private get jwtRefreshSecret() {
    return (
      process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production"
    );
  }

  async register(data: RegisterInput) {
    const existing = await this.repo.findUserByEmail(data.email);
    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.repo.createUser({ ...data, passwordHash });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(email: string, password: string) {
    const user = await this.repo.findUserByEmail(email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid email or password", 401);
    }

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = await this.generateRefreshToken(user.id);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    const stored = await this.repo.findRefreshToken(refreshToken);
    if (!stored) {
      throw new AppError("Invalid refresh token", 401);
    }

    if (new Date() > stored.expiresAt) {
      await this.repo.deleteRefreshToken(refreshToken);
      throw new AppError("Refresh token expired", 401);
    }

    const user = stored.user;
    if (!user.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    const accessToken = this.generateAccessToken(user.id, user.role);

    await this.repo.deleteRefreshToken(refreshToken);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    await this.repo.deleteRefreshToken(refreshToken);
  }

  async getAllUsers() {
    return this.repo.getAllUsers();
  }

  async getUserById(id: string) {
    const user = await this.repo.findUserById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, data: UpdateUserInput) {
    const user = await this.repo.findUserById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.repo.findUserByEmail(data.email);
      if (existing) {
        throw new AppError("Email already in use", 409);
      }
    }

    const updated = await this.repo.updateUser(id, data);
    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async deactivateUser(id: string) {
    const user = await this.repo.findUserById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updated = await this.repo.deactivateUser(id);
    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async forgotPassword(email: string) {
    const user = await this.repo.findUserByEmail(email);
    if (!user) {
      return { message: "If the email exists, a reset link has been sent" };
    }

    const token = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.repo.createPasswordReset(user.id, token, expiresAt);

    return { message: "If the email exists, a reset link has been sent", resetToken: token };
  }

  async resetPassword(token: string, newPassword: string) {
    const stored = await this.repo.findPasswordReset(token);
    if (!stored) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    if (new Date() > stored.expiresAt) {
      await this.repo.deletePasswordReset(token);
      throw new AppError("Reset token expired", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.updatePassword(stored.userId, passwordHash);
    await this.repo.deletePasswordReset(token);

    return { message: "Password reset successfully" };
  }

  private generateAccessToken(userId: string, role: string) {
    return jwt.sign({ userId, role }, this.jwtSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  private async generateRefreshToken(userId: string) {
    const token = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.repo.createRefreshToken(userId, token, expiresAt);
    return token;
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, this.jwtSecret) as { userId: string; role: string };
  }
}

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}
