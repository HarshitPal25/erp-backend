import { Router } from "express";
import {
  getJobWorks,
  createJobWork,
  completeJobWork,
} from "./jobWork.controller";
import { requireAuth, requireAdmin, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", getJobWorks);
router.post("/", requireRole("admin", "delhi"), createJobWork);
router.patch("/:id/complete", requireAdmin, completeJobWork);

export default router;
