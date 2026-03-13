import express from "express";
import { validateRole } from "@joblensai/shared/src/utils/validation.middleware.js";
import {
  UpdateJobSeekerProfileSchema,
  UpdateRecruiterProfileSchema,
} from "@joblensai/shared/src/schemas/user.schema.js";
import { getProfile, updateProfile, deleteAccount } from "@/controllers/profile.controller.js";

const router = express.Router();

router.get("/", getProfile);
router.put(
  "/",
  validateRole({
    jobseeker: UpdateJobSeekerProfileSchema,
    recruiter: UpdateRecruiterProfileSchema,
  }),
  updateProfile
);
router.delete("/", deleteAccount);

export default router;
