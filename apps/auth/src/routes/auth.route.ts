import express from "express";
import passport from "passport";
import { validate } from "@joblensai/shared/src/common/validation.middleware.js";
import {
  JobSeekerRegisterSchema,
  RecruiterRegisterSchema,
  JobSeekerLoginSchema,
  RecruiterLoginSchema,
} from "@joblensai/shared/src/schemas/auth.schema.js";
import {
  registerJobSeeker,
  registerRecruiter,
  loginJobSeeker,
  loginRecruiter,
  deleteJobSeeker,
  deleteRecruiter,
  getJobSeekerProfile,
  getRecruiterProfile,
  logout,
  validateToken,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from "@/controllers/auth.controller.js";
import {
  signAccessToken,
  signRefreshToken,
  setRefreshTokenCookie,
} from "@/lib/jwt.js";
import RefreshToken from "@joblensai/shared/src/models/refreshToken.model.js";

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
router.post("/jobseeker/login", validate(JobSeekerLoginSchema), loginJobSeeker);
router.post("/recruiter/login", validate(RecruiterLoginSchema), loginRecruiter);
router.delete("/jobseeker/profile", deleteJobSeeker);
router.delete("/recruiter/profile", deleteRecruiter);
router.get("/jobseeker/profile", getJobSeekerProfile);
router.get("/recruiter/profile", getRecruiterProfile);
router.post("/logout", logout);
router.get("/validate", validateToken);
router.post("/refresh", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

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
  "/callback/google",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  async (req, res) => {
    const user = req.user as any;
    const userId = user._id.toString();

    // Generate tokens
    const accessToken = signAccessToken(userId);
    const refreshToken = signRefreshToken(userId);

    // Store refresh token in DB
    await RefreshToken.create({
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Set refresh token cookie
    setRefreshTokenCookie(refreshToken, res);

    const origin = req.headers.origin;

    if (process.env.NODE_ENV === "production") {
      // Production: Redirect to frontend
      res.redirect(origin!);
    } else {
      // Development: Redirect to frontend
      res.redirect(origin! || "http://localhost/");
    }
  },
);

export default router;
