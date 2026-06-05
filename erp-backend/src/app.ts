import express from "express";
import cors from "cors";
import orderRoutes from "./modules/orders/order.routes";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/orders", orderRoutes);
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Mongo + Backend Working",
  });
});

export default app;