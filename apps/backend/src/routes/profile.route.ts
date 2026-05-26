import express from "express";
import { validateRole, validateSchema } from "@joblensai/shared/src/utils/validation.middleware.js";
import {
  UpdateJobSeekerProfileSchema,
  UpdateRecruiterProfileSchema,
  CompleteProfileSchema,
} from "@joblensai/shared/src/schemas/user.schema.js";
import {
  getProfile,
  updateProfile,
  completeProfile,
  deleteAccount,
} from "@/controllers/profile.controller.js";

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
// /complete uses validateSchema (not validateRole) because the caller has no
// role on their JWT yet — the role lives in the request body and the schema
// is a discriminated union over it.
router.post("/complete", validateSchema(CompleteProfileSchema), completeProfile);
router.delete("/", deleteAccount);

export default router;
