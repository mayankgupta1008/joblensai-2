import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";
import { disconnectProducer } from "@joblensai/shared/src/utils/kafka.config.js";
import passport from "@/lib/auth.config.js";
import authRoutes from "@/routes/auth.route.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// Auth Routes
app.use("/api/auth", authRoutes);

app.get("/api/auth/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// app.get("/api/metrics", async (req, res) => {
//   res.set("Content-Type", contentType);
//   res.end(await metricsEndpoint());
// });

const PORT = process.env.PORT || 5003;

const startServer = async () => {
  try {
    // Used .then() and .catch() as we need to reduce the up time when a kubernetes pod starts. If we use async-await then it will wait for the database to connect before starting the server hence increasing the up time.
    connectDB()
      .then(() => console.log("DB ready"))
      .catch((err: any) => console.error("DB failed"));
    app.listen(PORT, () => {
      process.env.NODE_ENV === "production"
        ? console.log(`Auth service running on ${PORT}`)
        : console.log(`Auth service running on http://localhost:${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
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
