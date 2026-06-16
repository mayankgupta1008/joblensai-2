import type { Request, Response } from "express";
import { createId } from "@paralleldrive/cuid2";
import JobSeeker from "@joblensai/shared/src/models/jobseeker.model.js";
import User from "@joblensai/shared/src/models/user.model.js";
import {
  getPresignedUploadUrl,
  getPresignedViewUrl,
  deleteFromS3,
  FILE_CONFIG,
} from "@joblensai/shared/src/utils/s3Utility.js";
import Payment from "@joblensai/shared/src/models/payment.model.js";

// ============ RESUME CONTROLLERS ============

export const uploadResume = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { fileName, contentType } = req.body;

    if (!FILE_CONFIG.resume.allowedMimeTypes.includes(contentType)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid Content Type. Only PDF Allowed." });
    }

    const ext = fileName.split(".").pop();
    const key = `${FILE_CONFIG.resume.folder}/${userId}/${createId()}.${ext}`;

    // Update and get OLD document in one call (new: false returns pre-update doc).
    // upsert: true ensures the document is created if it doesn't exist yet
    // (e.g. during onboarding before completeProfile is called).
    const oldJobSeeker = await JobSeeker.findOneAndUpdate(
      { userId },
      { resumeKey: key },
      { new: false, upsert: true } // Returns the document BEFORE update
    );

    // Delete old resume if exists (prevents orphaned files in S3)
    if (oldJobSeeker?.resumeKey) {
      await deleteFromS3(oldJobSeeker.resumeKey);
    }

    const presignedUrl = await getPresignedUploadUrl(key, contentType);

    return res.status(200).json({ presignedUrl, key });
  } catch (error) {
    console.error("Error inside uploadResume controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const viewResume = async (req: Request, res: Response) => {
  try {
    const authUserId = req.headers["x-user-id"] as string;
    const userRole = req.headers["x-user-role"] as string;
    const targetUserId = req.query.userId as string | undefined;

    // Determine which user's resume to fetch based on role
    let lookupUserId: string;

    if (userRole === "jobseeker") {
      if (targetUserId) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
      lookupUserId = authUserId;
    } else if (userRole === "recruiter") {
      if (!targetUserId) {
        return res.status(400).json({ success: false, error: "Bad Request" });
      }
      lookupUserId = targetUserId;
    } else {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    const jobSeeker = await JobSeeker.findOne({ userId: lookupUserId });
    if (!jobSeeker?.resumeKey) {
      return res.status(404).json({ success: false, error: "Resume Not Found" });
    }

    const presignedUrl = await getPresignedViewUrl(jobSeeker.resumeKey);

    return res.status(200).json({ presignedUrl });
  } catch (error) {
    console.error("Error inside viewResume controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const deleteResume = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    const jobSeeker = await JobSeeker.findOne({ userId });
    if (!jobSeeker?.resumeKey) {
      return res.status(404).json({ success: false, error: "Resume not found" });
    }

    const deleted = await deleteFromS3(jobSeeker.resumeKey);
    if (deleted) {
      await JobSeeker.findOneAndUpdate({ userId }, { resumeKey: null });
      return res.status(200).json({ success: true, message: "Resume Deleted Successfully" });
    }

    return res.status(500).json({ success: false, error: "Failed To Delete Resume" });
  } catch (error) {
    console.error("Error inside deleteResume controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ============ PROFILE PICTURE CONTROLLERS ============

export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { fileName, contentType } = req.body;

    if (!FILE_CONFIG["profile-picture"].allowedMimeTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid content type. Only JPG, JPEG, PNG, WebP allowed.",
      });
    }

    const ext = fileName.split(".").pop();
    const key = `${FILE_CONFIG["profile-picture"].folder}/${userId}/${createId()}.${ext}`;

    // Update and get OLD document in one call (new: false returns pre-update doc)
    const oldUser = await User.findByIdAndUpdate(
      userId,
      { profilePictureKey: key },
      { new: false } // Returns the document BEFORE update
    );

    // Delete old profile picture if exists (prevents orphaned files in S3)
    if (oldUser?.profilePictureKey) {
      await deleteFromS3(oldUser.profilePictureKey);
    }

    const presignedUrl = await getPresignedUploadUrl(key, contentType);

    return res.status(200).json({ presignedUrl, key });
  } catch (error) {
    console.error("Error inside uploadProfilePicture controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const viewProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const userRole = req.headers["x-user-role"] as string;
    const targetUserId = req.query.userId as string | undefined;

    let lookupUserId: string;

    if (userRole === "jobseeker") {
      if (targetUserId) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
      lookupUserId = userId;
    } else if (userRole === "recruiter") {
      // No param = own picture, with param = view jobseeker's picture
      lookupUserId = targetUserId || userId;
    } else {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    const user = await User.findById(lookupUserId);
    if (!user?.profilePictureKey) {
      return res.status(404).json({ success: false, error: "Profile Picture Not Found" });
    }

    const presignedUrl = await getPresignedViewUrl(user.profilePictureKey);

    return res.status(200).json({ presignedUrl });
  } catch (error) {
    console.error("Error inside viewProfilePicture controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const deleteProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    const user = await User.findById(userId);
    if (!user?.profilePictureKey) {
      return res.status(404).json({ success: false, error: "Profile Picture Not Found" });
    }

    const deleted = await deleteFromS3(user.profilePictureKey);
    if (deleted) {
      await User.findByIdAndUpdate(userId, { profilePictureKey: null });
      return res
        .status(200)
        .json({ success: true, message: "Profile Picture Deleted Successfully" });
    }

    return res.status(500).json({ success: false, error: "Failed To Delete Profile Picture" });
  } catch (error) {
    console.error("Error inside deleteProfilePicture controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const viewInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.headers["x-user-id"] as string;

    const payment = await Payment.findOne({ razorpayInvoiceId: invoiceId });
    if (!payment) {
      return res.status(404).json({ success: false, error: "Invoice Not Found" });
    }

    if (payment.userId.toString() !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    if (!payment.invoiceS3Key) {
      return res.status(404).json({ success: false, error: "Invoice Not Found" });
    }
    const presignedUrl = await getPresignedViewUrl(payment.invoiceS3Key);

    return res.status(200).json({ presignedUrl });
  } catch (error) {
    console.error("Error inside viewInvoice controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
