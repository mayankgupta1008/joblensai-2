import express from "express";
import {
  createJobPost,
  viewJobPost,
  deleteJobPost,
} from "@/controllers/jobPost.controller.js";
import { authorize } from "@/middlewares/authorize.middleware.js";

const router = express.Router();

// ============ JOB POST ROUTES ============
router.post("/create", authorize("recruiter"), createJobPost);
router.get("/view", authorize("any"), viewJobPost);
router.delete("/delete", authorize("recruiter"), deleteJobPost);

export default router;
