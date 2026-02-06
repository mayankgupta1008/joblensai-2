import express from "express";

const app = express();

app.get("/api/agent-service/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(5002, () => {
  console.log("Agent service running on port 5002");
});
