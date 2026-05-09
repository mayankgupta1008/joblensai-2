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
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
  setup2FA,
  verify2FA,
  validate2FA,
  disable2FA,
  setNewPassword,
} from "@/controllers/auth.controller.js";
import { generateTokens, requireAuth } from "@/lib/jwt.js";
import { getBaseUrl } from "@joblensai/shared/src/utils/getBaseUrl.js";

const router = express.Router();

router.post("/register", validateSchema(RegisterSchema), register);
router.post("/login", validateSchema(LoginSchema), login);
router.post("/forgot-password", validateSchema(ForgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validateSchema(ResetPasswordSchema), resetPassword);
router.post("/new-password", validateSchema(ResetPasswordSchema), requireAuth, setNewPassword);
router.get("/validate", validateToken);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.get("/sessions", requireAuth, getSessions);
router.delete("/sessions/:sid", requireAuth, revokeSession);
router.delete("/sessions", requireAuth, revokeAllOtherSessions);
router.post("/2fa/setup", requireAuth, setup2FA);
router.post("/2fa/verify", requireAuth, verify2FA);
router.post("/2fa/validate", validate2FA);
router.post("/2fa/disable", requireAuth, disable2FA);

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
    await generateTokens(user._id.toString(), user.role, req, res);
    res.redirect(getBaseUrl(req));
  }
);

export default router;
