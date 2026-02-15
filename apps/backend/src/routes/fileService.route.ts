import express from "express";
import {
  uploadFile,
  viewFile,
  deleteFile,
} from "@/controllers/fileService.controller.js";

const router = express.Router();

// POST /api/backend/files/upload
router.post("/upload", uploadFile);

// GET /api/backend/files/view?fileType=resume
router.get("/view", viewFile);

// DELETE /api/backend/files?fileType=resume
router.delete("/", deleteFile);

export default router;
