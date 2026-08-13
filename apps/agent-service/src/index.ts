import express from "express";
import {
  initMetrics,
  metricsEndpoint,
  contentType,
} from "@joblensai/shared/src/monitoring/metrics.js";
import resumeRoutes from "./routes/resume.route.js";
import outreachRoutes from "./routes/outreach.route.js";
import { initSentry, setupSentryErrorHandler } from "@joblensai/shared/src/monitoring/sentry.js";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";

const app = express();

initMetrics("agent-service");
initSentry("agent-service");

app.get("/api/agent-service/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/agent-service/metrics", async (req, res) => {
  res.set("Content-Type", contentType);
  res.end(await metricsEndpoint());
});

app.use("/api/agent-service/resume", resumeRoutes);
app.use("/api/agent-service/outreach", outreachRoutes);

setupSentryErrorHandler(app);

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Agent service running on PORT: ${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
