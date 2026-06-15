import { Router } from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
} from "./order.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/", createOrder);
router.get("/", getOrders);
router.patch("/:id/status", updateOrderStatus);

export default router;
