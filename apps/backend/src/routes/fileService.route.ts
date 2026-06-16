import express from "express";
import {
  uploadResume,
  viewResume,
  deleteResume,
  uploadProfilePicture,
  viewProfilePicture,
  deleteProfilePicture,
  viewInvoice,
} from "@/controllers/fileService.controller.js";
import { authenticate, authorize } from "@/middlewares/authorize.middleware.js";

const router = express.Router();

// ============ RESUME ROUTES ============
router.post("/upload/resume", authenticate, uploadResume);
router.get("/resume", authenticate, viewResume);
router.delete("/resume", authorize("jobseeker"), deleteResume);

// ============ PROFILE PICTURE ROUTES ============
router.post("/upload/profile-picture", authenticate, uploadProfilePicture);
router.get("/profile-picture", authenticate, viewProfilePicture);
router.delete("/profile-picture", authenticate, deleteProfilePicture);

// ============ INVOICE ROUTES ============
router.get("/invoice/:invoiceId", authenticate, viewInvoice);

export default router;
