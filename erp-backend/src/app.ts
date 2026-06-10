import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import orderRoutes from "./modules/orders/order.routes";
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Mongo + Backend Working",
  });
});

import inventoryRoutes from "./routes/inventoryRoutes";

app.use("/api/inventory", inventoryRoutes);

export default app;
