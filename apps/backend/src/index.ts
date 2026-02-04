import express from "express";

const app = express();

app.get("/backend/health", (req, res) => {
  res.send("OK");
});

app.listen(5001, () => {
  console.log("Backend service running on port 5001");
});
