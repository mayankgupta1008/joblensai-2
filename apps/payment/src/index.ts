import "dotenv/config";
import express from "express";
import paymentRoutes from "@/routes/payment.route.js";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";

const app = express();
app.use(express.json());

// Connect to Database
connectDB();

app.use("/api/payment", paymentRoutes);

app.get("/api/payment/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(5004, () => {
  console.log("Payment service is running on port 5004");
});
