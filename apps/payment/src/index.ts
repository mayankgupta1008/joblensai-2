import "dotenv/config";
import express from "express";
import paymentRoutes from "@/routes/payment.route.js";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";
import { connectRedis } from "@joblensai/shared/src/utils/redis.config.js";

const app = express();
app.use(express.json());

app.use("/api/payment", paymentRoutes);

app.get("/api/payment/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(5004, () => {
    console.log("Payment service is running on port 5004");
  });
};

startServer();
