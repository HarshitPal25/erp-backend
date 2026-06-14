import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import orderRoutes from "./modules/orders/order.routes";
import customerRoutes from "./modules/customers/customer.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
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
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Mongo + Backend Working",
  });
});

import inventoryRoutes from "./routes/inventoryRoutes";

app.use("/api/inventory", inventoryRoutes);

export default app;
