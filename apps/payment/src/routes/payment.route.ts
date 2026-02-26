import express from "express";
import {
  createSubscription,
  verifySubscription,
  cancelSubscription,
} from "@/controllers/payment.controller.js";
import {
  createSubscriptionrMiddleware,
  verifySubscriptionMiddleware,
  cancelSubscriptionMiddleware,
} from "@/middlewares/payment.middleware.js";

const router = express.Router();

router.post("/create-subscription", createSubscriptionrMiddleware, createSubscription);
router.post("/verify-subscription", verifySubscriptionMiddleware, verifySubscription);
router.post("/cancel-subscription", cancelSubscriptionMiddleware, cancelSubscription);

export default router;
