import { Router } from "express";
import {
  getJobWorks,
  createJobWork,
  completeJobWork,
} from "./jobWork.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", getJobWorks);
router.post("/", createJobWork);
router.patch("/:id/complete", completeJobWork);

export default router;
