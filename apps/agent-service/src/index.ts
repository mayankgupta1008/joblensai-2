import express from "express";
import {
  initMetrics,
  metricsEndpoint,
  contentType,
} from "@joblensai/shared/src/monitoring/metrics.js";

const app = express();

initMetrics("agent-service");

app.get("/api/agent-service/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/agent-service/metrics", async (req, res) => {
  res.set("Content-Type", contentType);
  res.end(await metricsEndpoint());
});

app.listen(5002, () => {
  console.log("Agent service running on port 5002");
});
