import "dotenv/config";
import express from "express";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";
import { emailConsumer, startEmailConsumer } from "@/lib/email.consumer.js";
import {
  initMetrics,
  metricsEndpoint,
  contentType,
} from "@joblensai/shared/src/monitoring/metrics.js";
import { initSocket, io } from "@/lib/socket.js";
import http from "http";

const app = express();
app.use(express.json());

const server = http.createServer(app);
initSocket(server);
initMetrics("notification");

// Connect to Database
await connectDB();

app.get("/api/notification/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/notification/metrics", async (req, res) => {
  res.set("Content-Type", contentType);
  res.end(await metricsEndpoint());
});

server.listen(5005, () => {
  console.log("Notification service is running on port 5005");
});

startEmailConsumer()
  .then(() => {
    console.log("Email consumer started");
  })
  .catch((error) => {
    console.error("Failed to start email consumer", error);
  });

const shutdown = async () => {
  console.log("Shutting down notification service...");
  io.close(() => console.log("Socket.IO server closed"));
  await emailConsumer.disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
