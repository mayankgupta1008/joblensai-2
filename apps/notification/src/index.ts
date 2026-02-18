import "dotenv/config";
import express from "express";
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";

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
