import express from "express";
import { createOrder, verifyOrder } from "@/controllers/payment.controller.js";
import { createOrderMiddleware, verifyOrderMiddleware } from "@/middlewares/payment.middleware.js";

const router = express.Router();

router.post("/create-order", createOrderMiddleware, createOrder);
router.post("/verify-order", verifyOrderMiddleware, verifyOrder);

export default router;
