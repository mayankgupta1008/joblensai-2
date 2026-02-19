import type { Request } from "express";

export const getBaseUrl = (req: Request): string => {
  const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";

  const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "localhost";

  const baseUrl = `${protocol}://${host}`;
  return baseUrl;
};
