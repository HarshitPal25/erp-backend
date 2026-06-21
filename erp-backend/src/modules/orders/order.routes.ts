import { Router } from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  updateDelivery,
  createJobWorkFromOrder,
  createDispatchFromOrder,
} from "./order.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/", createOrder);
router.get("/", getOrders);
router.post("/:id/jobwork", createJobWorkFromOrder);
router.post("/:id/dispatch", createDispatchFromOrder);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/delivery", updateDelivery);

export default router;
