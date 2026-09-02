import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  statusCode?: number;
  details?: Record<string, unknown>;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(`[Error] ${err.message}`, err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  const body: Record<string, unknown> = { message };
  if (err.details) {
    body.details = err.details;
  }

  res.status(statusCode).json(body);
}
