import { Router } from "express";
import { getDashboardStats, getRecentOrders } from "./dashboard.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/stats", getDashboardStats);
router.get("/recent-orders", getRecentOrders);

export default router;
