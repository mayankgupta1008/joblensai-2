import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";
import { disconnectProducer } from "@joblensai/shared/src/utils/kafka.config.js";
import passport from "@/lib/auth.config.js";
import authRoutes from "@/routes/auth.route.js";
import {
  initMetrics,
  metricsEndpoint,
  contentType,
} from "@joblensai/shared/src/monitoring/metrics.js";

const app = express();

// Trust the single proxy hop in front of us (nginx-ingress locally, ALB in prod)
// so req.ip resolves to the real client IP from X-Forwarded-For, not the proxy's IP.
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
initMetrics("auth");

// Initialize Passport
app.use(passport.initialize());

// Auth Routes
app.use("/api/auth", authRoutes);

app.get("/api/auth/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/auth/metrics", async (req, res) => {
  res.set("Content-Type", contentType);
  res.end(await metricsEndpoint());
});

const PORT = process.env.PORT || 5003;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Auth service running on PORT: ${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down auth service...");
  await disconnectProducer();
  process.exit(0);
};

// Required when we either use docker compose up without -d (detached mode) or we use pnpm dev for local testing without docker
process.on("SIGINT", shutdown);

// Required when running in Docker (Kubernetes sends SIGTERM)
process.on("SIGTERM", shutdown);
