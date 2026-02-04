import express from "express";

const app = express();

app.get("/agent-service/health", (req, res) => {
  res.send("OK");
});

app.listen(5002, () => {
  console.log("Agent service running on port 5002");
});
