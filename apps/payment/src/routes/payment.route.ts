import express from "express";
import { createOrder, verifyOrder } from "@/controllers/payment.controller.js";

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify-order", verifyOrder);

export default router;
