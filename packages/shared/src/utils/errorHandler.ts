import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export const errorHandler = (err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  const errorId = randomUUID();
  console.error(`[${errorId}]`, err);

  const isDev = process.env.NODE_ENV !== "production";
  res.status(500).json({
    success: false,
    error: isDev ? err.message : "Internal Server Error",
    errorId,
    ...(isDev && { stack: err.stack }),
  });
};
