import { Router } from "express";
import {
  createOrder,
  getOrders,
} from "./order.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/", createOrder);
router.get("/", getOrders);

export default router;
