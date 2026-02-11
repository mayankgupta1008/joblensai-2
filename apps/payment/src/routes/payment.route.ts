import express from "express";
import { createOrder, verifyOrder } from "@/controllers/payment.controller.js";
import { idempotencyMiddleware } from "@/middlewares/payment.middleware.js";

const router = express.Router();

router.post("/create-order", idempotencyMiddleware, createOrder);
router.post("/verify-order", idempotencyMiddleware, verifyOrder);

export default router;
