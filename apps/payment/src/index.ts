import "dotenv/config";
import express from "express";
import paymentRoutes from "@/routes/payment.route.js";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";
import { initCronJobs } from "@/lib/cron.js";
import {
  initMetrics,
  metricsEndpoint,
  contentType,
} from "@joblensai/shared/src/monitoring/metrics.js";
import { initSentry, setupSentryErrorHandler } from "@joblensai/shared/src/monitoring/sentry.js";

const app = express();
app.use(express.json());
initMetrics("payment");
initSentry("payment");

app.use("/api/payment", paymentRoutes);

app.get("/api/payment/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/payment/metrics", async (req, res) => {
  res.set("Content-Type", contentType);
  res.end(await metricsEndpoint());
});

setupSentryErrorHandler(app);

const startServer = async () => {
  await connectDB();

  // Initialize background jobs
  initCronJobs();

  app.listen(5004, () => {
    console.log("Payment service is running on port 5004");
  });
};

startServer();
