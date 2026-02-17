import express from "express";
import {
  uploadJobPost,
  viewJobPost,
  deleteJobPost,
} from "@/controllers/jobPost.controller.js";

const router = express.Router();

// ============ JOB POST ROUTES ============
router.post("/create", uploadJobPost);
router.get("/", viewJobPost);
router.delete("/", deleteJobPost);

export default router;
