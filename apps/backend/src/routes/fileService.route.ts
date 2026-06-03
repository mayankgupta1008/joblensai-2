import express from "express";
import {
  uploadResume,
  viewResume,
  deleteResume,
  uploadProfilePicture,
  viewProfilePicture,
  deleteProfilePicture,
} from "@/controllers/fileService.controller.js";
import { authenticate, authorize } from "@/middlewares/authorize.middleware.js";

const router = express.Router();

// ============ RESUME ROUTES ============
router.post("/upload/resume", authorize("jobseeker"), uploadResume);
router.get("/resume", authenticate, viewResume);
router.delete("/resume", authorize("jobseeker"), deleteResume);

// ============ PROFILE PICTURE ROUTES ============
router.post("/upload/profile-picture", authenticate, uploadProfilePicture);
router.get("/profile-picture", authenticate, viewProfilePicture);
router.delete("/profile-picture", authenticate, deleteProfilePicture);

export default router;
