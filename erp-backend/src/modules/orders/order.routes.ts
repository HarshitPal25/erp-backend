import { Router } from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  updateDelivery,
} from "./order.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/", createOrder);
router.get("/", getOrders);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/delivery", updateDelivery);

export default router;
