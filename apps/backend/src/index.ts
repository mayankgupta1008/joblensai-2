import "dotenv/config";
import express from "express";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";
import profileRoutes from "@/routes/profile.route.js";
import fileServiceRoutes from "@/routes/fileService.route.js";
import jobPostRoutes from "@/routes/jobPost.route.js";
import {
  initMetrics,
  metricsEndpoint,
  contentType,
} from "@joblensai/shared/src/monitoring/metrics.js";
import { initSentry, setupSentryErrorHandler } from "@joblensai/shared/src/monitoring/sentry.js";

const app = express();

app.use(express.json());
initMetrics("backend");
initSentry("backend");

app.use("/api/account", profileRoutes);
app.use("/api/file", fileServiceRoutes);
app.use("/api/job", jobPostRoutes);

app.get("/api/backend/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/backend/metrics", async (req, res) => {
  res.set("Content-Type", contentType);
  res.end(await metricsEndpoint());
});

setupSentryErrorHandler(app);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Backend service running on PORT: ${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
