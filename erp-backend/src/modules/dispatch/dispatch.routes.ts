import { Router } from "express";
import {
  createDispatch,
  getDispatches,
  updateDispatchStatus,
} from "./dispatch.controller";
import { requireAuth, requireAdmin, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", getDispatches);
router.post("/", requireRole("admin", "delhi"), createDispatch);
router.patch("/:id/status", requireAdmin, updateDispatchStatus);

export default router;
