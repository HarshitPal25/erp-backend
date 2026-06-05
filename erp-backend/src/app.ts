import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Mongo + Backend Working",
  });
});

export default app;