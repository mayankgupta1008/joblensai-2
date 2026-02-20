import type { Request, Response, NextFunction } from "express";

type Role = "jobseeker" | "recruiter" | "any";

// Simple role-based middleware factory
// Usage: requireRole("recruiter") or requireRole("jobseeker") or requireRole("any")
export const authorize = (allowedRole: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const userRole = req.headers["x-user-role"] as Role;

      if (!userId || !userRole) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // TODO(human): Implement the role checking logic
      // You have access to:
      // - userRole: the user's role from headers ("jobseeker" or "recruiter")
      // - allowedRole: the required role for this route ("jobseeker", "recruiter", or "any")
      //
      // Logic needed:
      // 1. If allowedRole is "any", allow both roles through
      // 2. If allowedRole matches userRole, allow through
      // 3. Otherwise, return 403 Forbidden
      //
      // Call next() to allow, or return res.status(403).json({...}) to deny

      if (allowedRole === "any" || allowedRole === userRole) {
        next();
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }
    } catch (error) {
      console.error("Error inside authorize middleware", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
