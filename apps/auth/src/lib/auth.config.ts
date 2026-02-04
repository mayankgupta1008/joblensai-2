import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcryptjs";
import JobSeeker from "@joblensai/shared/src/models/jobSeeker.model.js";
import Recruiter from "@joblensai/shared/src/models/recruiter.model.js";
import mongoose from "mongoose";

// ── Helper ─────────────────────────────────────────
function getModel(role: string): mongoose.Model<any> {
  if (role === "recruiter") return Recruiter;
  if (role === "jobseeker") return JobSeeker;
  throw new Error("Invalid role");
}

// ── 1. JWT Strategy ────────────────────────────────
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload, done) => {
      try {
        const user = await getModel(payload.role).findById(payload.id);
        if (!user) return done(null, false);
        return done(null, { ...user.toObject(), role: payload.role });
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

// ── 2. Local Strategy ──────────────────────────────
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req: any, email: string, password: string, done) => {
      try {
        const role = req.body.role as string;

        const user = await getModel(role)
          .findOne({ email })
          .select("+password");

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        if (!user.password) {
          return done(null, false, {
            message: "This account uses Google login",
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, { ...user.toObject(), role });
      } catch (error) {
        return done(error);
      }
    },
  ),
);

// ── 3. Google Strategy ─────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? process.env.GOOGLE_CALLBACK_URL!
          : "http://localhost:5003/api/auth/google/callback",
      passReqToCallback: true,
      scope: ["profile", "email"],
    },
    async (req: any, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const role = req.query.state as string;

        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        const Model = getModel(role);
        const user = await Model.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, { ...user.toObject(), role });
        }

        // New user
        const fullName =
          `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() ||
          profile.displayName;

        const newUserData: any = {
          fullName,
          email,
          googleId: profile.id,
          profilePicture: profile.photos?.[0]?.value,
          role,
          emailVerified: true,
        };

        if (role === "recruiter") {
          newUserData.companyName = "PENDING_COMPLETION";
        }

        const newUser = await Model.create(newUserData);

        return done(null, {
          ...newUser.toObject(),
          role,
          requiresProfileCompletion: true,
        });
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export default passport;
