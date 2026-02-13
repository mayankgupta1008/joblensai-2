import "dotenv/config";
import express from "express";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";
import profileRoutes from "@/routes/profile.route.js";

const app = express();

app.use(express.json());

app.use("/api/account", profileRoutes);

app.get("/api/backend/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    connectDB()
      .then(() => console.log("DB ready"))
      .catch((err) => console.error("DB failed:", err));
    app.listen(PORT, () => {
      process.env.NODE_ENV === "production"
        ? console.log(`Backend service running on ${PORT}`)
        : console.log(`Backend service running on http://localhost:${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
  }
};

startServer();
