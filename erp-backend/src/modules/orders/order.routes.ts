import { Router } from "express";
import {
  createOrder,
  getOrders,
} from "./order.controller";

const router = Router();

router.post("/", createOrder);
router.get("/", getOrders);

export default router;