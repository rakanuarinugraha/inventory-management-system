import { Request, Response, NextFunction } from "express";

type Role = "ADMIN" | "MANAGER" | "STAFF";

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
      return;
    }

    next();
  };
}
