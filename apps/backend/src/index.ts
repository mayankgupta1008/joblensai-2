import express from "express";

const app = express();

app.get("/api/backend/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(5001, () => {
  console.log("Backend service running on port 5001");
});
