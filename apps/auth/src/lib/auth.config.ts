import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "@joblensai/shared/src/models/user.model.js";
import JobSeeker from "@joblensai/shared/src/models/jobseeker.model.js";
import Recruiter from "@joblensai/shared/src/models/recruiter.model.js";

// ── Google Strategy ─────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      passReqToCallback: true,
      scope: ["profile", "email"],
    },
    async (req: any, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const role = (req.query.state as string) || "jobseeker";

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

        // New user
        const fullName =
          `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() ||
          profile.displayName;

        const newUser = await User.create({
          fullName,
          email,
          googleId: profile.id,
          profilePictureKey: null,
          role,
          emailVerified: true,
        });

        // Create profile based on role
        if (role === "jobseeker") {
          await JobSeeker.create({ userId: newUser._id });
        } else if (role === "recruiter") {
          await Recruiter.create({ userId: newUser._id });
        }

        return done(null, {
          ...newUser.toObject(),
          requiresProfileCompletion: true,
        });
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export default passport;
