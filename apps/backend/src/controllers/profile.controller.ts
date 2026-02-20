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
      "fullName email phoneNumber role profilePictureKey emailVerified isProfileComplete";

    const profile =
      userRole === "jobseeker"
        ? await JobSeeker.findOne({ userId }).populate("userId", userFields)
        : await Recruiter.findOne({ userId }).populate("userId", userFields);

    if (!profile) {
      return res.status(400).json({ message: "Profile not found" });
    }

    const { userId: user, ...profileData } = profile.toObject();
    return res.status(200).json({ ...user, ...profileData });
  } catch (error) {
    console.log("Error inside getProfile controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
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
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json(updatedProfile);
  } catch (error) {
    console.log("Error inside updateProfile controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const userRole = req.headers["x-user-role"] as string;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
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

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.log("Error inside deleteAccount controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
