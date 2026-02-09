import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

// Role-based validation middleware for endpoints with different schemas per role
export const validateRole = (schemas: {
  jobseeker: ZodType<any, any>;
  recruiter: ZodType<any, any>;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.headers["x-user-role"] as string;

      if (!["jobseeker", "recruiter"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      const schema =
        role === "jobseeker" ? schemas.jobseeker : schemas.recruiter;

      const parsed = await schema.parseAsync({ body: req.body });
      req.body = parsed.body;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: "Internal server error during validation",
      });
    }
  };
};

// Standard validation middleware (kept for backward compatibility)
export const validateSchema =
  (schema: ZodType<any, any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: "Internal server error during validation",
      });
    }
  };
