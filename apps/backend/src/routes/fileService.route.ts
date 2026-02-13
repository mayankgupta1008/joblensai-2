import express from "express";
import {
  getUploadUrl,
  getDownloadUrl,
  deleteFile,
} from "@/controllers/fileService.controller.js";

const router = express.Router();

// GET /api/files/upload-url?type=resume&contentType=application/pdf
router.get("/upload", getUploadUrl);

// GET /api/files/:fileKey/download-url
router.get("/:fileKey/download", getDownloadUrl);

// DELETE /api/files/:fileKey
router.delete("/:fileKey", deleteFile);

export default router;
