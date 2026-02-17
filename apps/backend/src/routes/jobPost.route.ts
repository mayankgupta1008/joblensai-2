import express from "express";
import {
  createJobPost,
  viewJobPost,
  deleteJobPost,
} from "@/controllers/jobPost.controller.js";

const router = express.Router();

// ============ JOB POST ROUTES ============
router.post("/create", createJobPost);
router.get("/view", viewJobPost);
router.delete("/delete", deleteJobPost);

export default router;
