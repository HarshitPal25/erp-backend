import { Router } from "express";
import {
  createDispatch,
  getDispatches,
  updateDispatchStatus,
} from "./dispatch.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", getDispatches);
router.post("/", createDispatch);
router.patch("/:id/status", updateDispatchStatus);

export default router;
