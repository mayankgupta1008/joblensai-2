import express from "express";
import dotenv from "dotenv";
import { connectDB } from "@joblensai/shared/src/common/db.config.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.config.js";

dotenv.config();

const app = express();

/**
 * 2. Mount BetterAuth Handler
 * This single line handles ALL auth logic:
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-in/email
 * - GET  /api/auth/get-session
 * - etc.
 */

// Better-auth suggests to put this before express.json()
app.use("/api/auth", toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// app.get("/api/metrics", async (req, res) => {
//   res.set("Content-Type", contentType);
//   res.end(await metricsEndpoint());
// });

const PORT = process.env.PORT || 5003;

const startServer = async () => {
  try {
    // Used .then() and .catch() as we need to reduce the up time when a kubernetes pod starts. If we use async-await then ir will wait for the database to connect before starting the server hence increasing the up time.
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
