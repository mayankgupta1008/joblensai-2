import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "@joblensai/shared/src/models/user.model.js";

// ── Google Strategy ─────────────────────────────
// Role is no longer captured at sign-up time. New Google users are created
// without a role; they choose it later through POST /profile/complete, which
// also creates the matching JobSeeker / Recruiter doc.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["profile", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        const user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, { ...user.toObject() });
        }

        // New user — no role yet.
        const fullName =
          `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() ||
          profile.displayName;

        const newUser = await User.create({
          fullName,
          email,
          googleId: profile.id,
          profilePictureKey: null,
          emailVerified: true,
        });

        return done(null, {
          ...newUser.toObject(),
          requiresProfileCompletion: true,
        });
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;
