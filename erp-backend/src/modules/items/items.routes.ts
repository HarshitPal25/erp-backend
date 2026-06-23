import { Router } from "express";
import { getAllItems, createItem, updateItem, deleteItem } from "./items.controller";
import { requireAuth, requireAdmin, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", getAllItems);
router.post("/", requireRole("admin", "delhi"), createItem);
router.put("/:id", requireAdmin, updateItem);
router.delete("/:id", requireAdmin, deleteItem);

export default router;
