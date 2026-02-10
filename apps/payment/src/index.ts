import "dotenv/config";
import express from "express";

const app = express();

app.get("/api/payment/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(5004, () => {
  console.log("Payment service is running on port 5004");
});
