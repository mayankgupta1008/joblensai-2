import express from "express";
import {
  uploadResume,
  viewResume,
  deleteResume,
  uploadProfilePicture,
  viewProfilePicture,
  deleteProfilePicture,
} from "@/controllers/fileService.controller.js";

const router = express.Router();

// ============ RESUME ROUTES ============
router.post("/resume/upload", uploadResume);
router.get("/resume", viewResume);
router.delete("/resume", deleteResume);

// ============ PROFILE PICTURE ROUTES ============
router.post("/profile-picture/upload", uploadProfilePicture);
router.get("/profile-picture", viewProfilePicture);
router.delete("/profile-picture", deleteProfilePicture);

export default router;
