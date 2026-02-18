import "dotenv/config";
import express from "express";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";
import { emailConsumer, startEmailConsumer } from "@/lib/email.consumer.js";

const app = express();
app.use(express.json());

// Connect to Database
connectDB();

app.get("/api/notification/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(5005, () => {
  console.log("Notification service is running on port 5005");
});

startEmailConsumer()
  .then(() => {
    console.log("Email consumer started");
  })
  .catch((error) => {
    console.error("Failed to start email consumer", error);
  });

// Add shutdown handlers:
const shutdown = async () => {
  console.log("Shutting down notification service...");
  await emailConsumer.disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
