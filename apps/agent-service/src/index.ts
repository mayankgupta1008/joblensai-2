import express from "express";
import {
  initMetrics,
  metricsEndpoint,
  contentType,
} from "@joblensai/shared/src/monitoring/metrics.js";
import resumeRoutes from "./routes/resume.route.js";
import outreachRoutes from "./routes/outreach.route.js";
import { initSentry, setupSentryErrorHandler } from "@joblensai/shared/src/monitoring/sentry.js";

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

app.listen(5002, () => {
  console.log("Agent service running on port 5002");
});
