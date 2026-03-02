import express from "express";
import {
  createSubscription,
  verifySubscription,
  cancelSubscription,
  renewSubscription,
} from "@/controllers/payment.controller.js";
import {
  createSubscriptionrMiddleware,
  verifySubscriptionMiddleware,
  cancelSubscriptionMiddleware,
} from "@/middlewares/payment.middleware.js";
import {
  CreateSubscriptionBodySchema,
  VerifySubscriptionBodySchema,
} from "@joblensai/shared/src/schemas/payment.schema.js";
import { validateSchema } from "@joblensai/shared/src/utils/validation.middleware.js";

const router = express.Router();

router.post(
  "/create-subscription",
  validateSchema(CreateSubscriptionBodySchema),
  createSubscriptionrMiddleware,
  createSubscription
);
router.post(
  "/verify-subscription",
  validateSchema(VerifySubscriptionBodySchema),
  verifySubscriptionMiddleware,
  verifySubscription
);
router.post("/cancel-subscription", cancelSubscriptionMiddleware, cancelSubscription);
router.post("/renew-subscription", renewSubscription);

export default router;
