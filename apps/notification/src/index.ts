import "dotenv/config";
import express from "express";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";
import { emailConsumer, startEmailConsumer } from "@/lib/email-service/email.consumer.js";
import {
  initMetrics,
  metricsEndpoint,
  contentType,
} from "@joblensai/shared/src/monitoring/metrics.js";
import { initSocket, io } from "@/lib/socket.js";
import http from "http";
import notificationRoutes from "@/routes/notification.route.js";
import { initSentry, setupSentryErrorHandler } from "@joblensai/shared/src/monitoring/sentry.js";

const app = express();
app.use(express.json());

const server = http.createServer(app);
initSocket(server);
initMetrics("notification");
initSentry("notifications");

// Connect to Database
await connectDB();

app.get("/api/notification/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/notification/metrics", async (req, res) => {
  res.set("Content-Type", contentType);
  res.end(await metricsEndpoint());
});

app.use("/api/notifications", notificationRoutes);

setupSentryErrorHandler(app);

const PORT = process.env.PORT || 5005;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Notification service running on PORT: ${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
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
