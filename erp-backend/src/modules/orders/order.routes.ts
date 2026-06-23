import { Router } from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  updateDelivery,
  createJobWorkFromOrder,
  createDispatchFromOrder,
} from "./order.controller";
import { requireAuth, requireAdmin, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/", requireRole("admin", "delhi"), createOrder);
router.get("/", getOrders);
router.post("/:id/jobwork", requireAdmin, createJobWorkFromOrder);
router.post("/:id/dispatch", requireAdmin, createDispatchFromOrder);
router.patch("/:id/status", requireAdmin, updateOrderStatus);
router.patch("/:id/delivery", requireAdmin, updateDelivery);

export default router;
