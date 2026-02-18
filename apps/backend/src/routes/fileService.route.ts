import express from "express";
import {
  uploadResume,
  viewResume,
  deleteResume,
  uploadProfilePicture,
  viewProfilePicture,
  deleteProfilePicture,
} from "@/controllers/fileService.controller.js";
import { authorize } from "@/middlewares/authorize.middleware.js";

const router = express.Router();

// ============ RESUME ROUTES ============
router.post("/upload/resume", authorize("jobseeker"), uploadResume);
router.get("/resume", authorize("any"), viewResume);
router.delete("/resume", authorize("jobseeker"), deleteResume);

// ============ PROFILE PICTURE ROUTES ============
router.post("/upload/profile-picture", authorize("any"), uploadProfilePicture);
router.get("/profile-picture", authorize("any"), viewProfilePicture);
router.delete("/profile-picture", authorize("any"), deleteProfilePicture);

export default router;
