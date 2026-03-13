import express from "express";
import passport from "passport";
import { validateSchema } from "@joblensai/shared/src/utils/validation.middleware.js";
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@joblensai/shared/src/schemas/user.schema.js";
import {
  logout,
  validateToken,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  register,
  login,
} from "@/controllers/auth.controller.js";
import { signRefreshToken, setRefreshTokenCookie } from "@/lib/jwt.js";
import RefreshToken from "@joblensai/shared/src/models/refreshToken.model.js";
import { getBaseUrl } from "@joblensai/shared/src/utils/getBaseUrl.js";

const router = express.Router();

router.post("/register", validateSchema(RegisterSchema), register);
router.post("/login", validateSchema(LoginSchema), login);
router.post("/forgot-password", validateSchema(ForgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validateSchema(ResetPasswordSchema), resetPassword);
router.get("/validate", validateToken);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

// Google OAuth Login
router.get("/google", (req, res, next) => {
  const role = (req.query.role as string) || "jobseeker";
  const callbackURL = `${getBaseUrl(req)}/api/auth/callback/google`;

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: role,
    session: false,
    callbackURL,
  } as any)(req, res, next);
});

router.get(
  "/callback/google",
  (req, res, next) => {
    const callbackURL = `${getBaseUrl(req)}/api/auth/callback/google`;

    passport.authenticate("google", {
      session: false,
      callbackURL,
    } as any)(req, res, next);
  },
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

    // Redirect to frontend - use getBaseUrl instead of origin
    const baseUrl = getBaseUrl(req);
    res.redirect(baseUrl);
  }
);

export default router;
