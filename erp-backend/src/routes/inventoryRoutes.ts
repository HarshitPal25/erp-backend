import express from "express";
import {
  getInventory,
  getCategories,
  addStockTransaction,
  getLedger,
  createNewItem,
  deleteInventoryItem,
} from "../controllers/InventoryController";
import { requireAuth, requireAdmin, requireRole } from "../middleware/auth.middleware";

const router = express.Router();

router.use(requireAuth);
router.get("/categories", getCategories);
router.get("/", getInventory);
router.post("/transactions", requireRole("admin", "delhi"), addStockTransaction);
router.get("/ledger/:inventoryId", getLedger);
router.post("/items", requireRole("admin", "delhi"), createNewItem);
router.delete("/:id", requireAdmin, deleteInventoryItem);

export default router;