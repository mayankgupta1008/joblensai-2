import express from "express";
import {
  uploadFile,
  viewFile,
  deleteFile,
} from "@/controllers/fileService.controller.js";

const router = express.Router();

// POST /api/files/upload
router.post("/upload", uploadFile);

// GET /api/files/view?fileType=resume
router.get("/view", viewFile);

// DELETE /api/files?fileType=resume
router.delete("/", deleteFile);

export default router;
