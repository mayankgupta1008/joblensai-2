import express from "express";
import passport from "passport";
import { validate } from "@joblensai/shared/src/common/validation.middleware.js";
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@joblensai/shared/src/schemas/auth.schema.js";
import {
  logout,
  validateToken,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  register,
  login,
  getProfile,
  deleteAccount,
} from "@/controllers/auth.controller.js";
import { signRefreshToken, setRefreshTokenCookie } from "@/lib/jwt.js";
import RefreshToken from "@joblensai/shared/src/models/refreshToken.model.js";

const router = express.Router();

router.post("/register", validate(RegisterSchema), register);
router.post("/login", validate(LoginSchema), login);
router.post("/forgot-password", validate(ForgotPasswordSchema), forgotPassword);
router.post(
  "/reset-password/:token",
  validate(ResetPasswordSchema),
  resetPassword,
);
router.get("/profile", getProfile);
router.delete("/profile", deleteAccount);
router.get("/validate", validateToken);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

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
    const role = user.role;

    // Generate tokens
    const refreshToken = signRefreshToken(userId, role);

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
