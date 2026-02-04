import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { validate } from "@joblensai/shared/src/common/validation.middleware.js";
import {
  JobSeekerRegisterSchema,
  RecruiterRegisterSchema,
} from "@joblensai/shared/src/schemas/auth.schema.js";
import {
  registerJobSeeker,
  registerRecruiter,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post(
  "/jobseeker/register",
  validate(JobSeekerRegisterSchema),
  registerJobSeeker,
);
router.post(
  "/recruiter/register",
  validate(RecruiterRegisterSchema),
  registerRecruiter,
);

// Google OAuth Login
router.get("/google", (req, res, next) => {
  const role = (req.query.role as string) || "jobseeker";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: role,
    session: false,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const user = req.user as any;
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    // For testing — just show the token in browser
    res.json({ token, user });

    // Later in production, redirect to frontend:
    // res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  },
);

export default router;
