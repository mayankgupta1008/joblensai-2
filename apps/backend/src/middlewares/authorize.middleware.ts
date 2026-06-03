import type { Request, Response, NextFunction } from "express";

type Role = "jobseeker" | "recruiter";

// The gateway validates the JWT and injects x-user-id (present once the token is
// valid) and x-user-role (empty until the user finishes onboarding and picks a
// role). These two middlewares turn those headers into access decisions.
// Authentication and authorization are kept separate so resources that every
// user owns stay reachable even before a role is assigned.

// Authentication: any logged-in user. Use for resources common to all users
// regardless of role (e.g. profile picture), including users still onboarding.
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};

// Authorization: a logged-in user holding a specific role. A missing/empty role
// (onboarding) or a mismatched role is authenticated-but-forbidden => 403.
export const authorize = (allowedRole: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers["x-user-id"] as string | undefined;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRole = req.headers["x-user-role"] as Role | undefined;
    if (userRole !== allowedRole) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
};
