import type { Request, Response } from "express";
import User from "@joblensai/shared/src/models/user.model.js";
import JobSeeker from "@joblensai/shared/src/models/jobseeker.model.js";
import Recruiter from "@joblensai/shared/src/models/recruiter.model.js";
import RefreshToken from "@joblensai/shared/src/models/refreshToken.model.js";
import Payment from "@joblensai/shared/src/models/payment.model.js";
import Subscription from "@joblensai/shared/src/models/subscription.model.js";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const userRole = req.headers["x-user-role"] as string;

    const userFields =
      "fullName email phoneNumber role profilePictureKey emailVerified phoneNumberVerified isProfileComplete";

    const profile =
      userRole === "jobseeker"
        ? await JobSeeker.findOne({ userId }).populate("userId", userFields)
        : await Recruiter.findOne({ userId }).populate("userId", userFields);

    if (!profile) {
      return res.status(400).json({ success: false, error: "Profile Not Found" });
    }

    const { userId: user, ...profileData } = profile.toObject();
    return res.status(200).json({ success: true, ...user, ...profileData });
  } catch (error) {
    console.log("Error inside getProfile controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const userRole = req.headers["x-user-role"] as string;

    const updatedProfile =
      userRole === "jobseeker"
        ? await JobSeeker.findOneAndUpdate({ userId }, req.body, {
            new: true,
            runValidators: true,
          })
        : await Recruiter.findOneAndUpdate({ userId }, req.body, {
            new: true,
            runValidators: true,
          });

    if (!updatedProfile) {
      return res.status(404).json({ success: false, error: "Profile Not Found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Profile Updated Successfully", updatedProfile });
  } catch (error) {
    console.log("Error inside updateProfile controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const completeProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    // Role comes from the body (the user picks it in the wizard) — at this
    // point the JWT carries an empty role, so we can't trust x-user-role.
    const { role, phoneNumber, profilePictureKey, ...roleFields } = req.body;

    if (role !== "jobseeker" && role !== "recruiter") {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    const existing = await User.findById(userId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "User Not Found" });
    }
    if (existing.isProfileComplete) {
      return res.status(400).json({ success: false, error: "Profile is already complete" });
    }

    const userUpdate: Record<string, unknown> = {
      role,
      phoneNumber,
      isProfileComplete: true,
    };
    if (profilePictureKey) userUpdate.profilePictureKey = profilePictureKey;

    const roleDocOpts = {
      new: true,
      runValidators: true,
      upsert: true,
      setDefaultsOnInsert: true,
    };
    const [updatedUser, updatedProfile] = await Promise.all([
      User.findByIdAndUpdate(userId, userUpdate, { new: true, runValidators: true }),
      role === "jobseeker"
        ? JobSeeker.findOneAndUpdate({ userId }, roleFields, roleDocOpts)
        : Recruiter.findOneAndUpdate({ userId }, roleFields, roleDocOpts),
    ]);

    if (!updatedUser || !updatedProfile) {
      return res.status(500).json({ success: false, error: "Failed to save profile" });
    }

    // NOTE for callers: the access-token cookie still carries the old (empty)
    // role at this point. The client should call POST /auth/refresh next to
    // get a token stamped with the new role before hitting role-gated routes.
    return res.status(200).json({
      success: true,
      message: "Profile Completed Successfully",
      role,
      isProfileComplete: true,
      phoneNumber: updatedUser.phoneNumber,
      profilePictureKey: updatedUser.profilePictureKey || null,
    });
  } catch (error) {
    console.log("Error inside completeProfile controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const userRole = req.headers["x-user-role"] as string;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(400).json({ success: false, error: "User Not Found" });
    }

    // Run all independent deletes in PARALLEL to reduce api calls
    await Promise.all([
      RefreshToken.deleteMany({ userId }),
      Payment.deleteMany({ userId }),
      Subscription.deleteMany({ userId }),
      userRole === "jobseeker"
        ? JobSeeker.findOneAndDelete({ userId })
        : Recruiter.findOneAndDelete({ userId }),
    ]);

    // Clear auth cookies from browser
    res.cookie("accessToken", "", { maxAge: 0 });
    res.cookie("refreshToken", "", { maxAge: 0 });

    return res.status(200).json({ success: true, message: "Account Deleted Successfully" });
  } catch (error) {
    console.log("Error inside deleteAccount controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
