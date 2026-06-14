import express from "express";
import {
  getInventory,
  getCategories,
  addStockTransaction,
  getLedger,
  createNewItem,
  deleteInventoryItem,
} from "../controllers/InventoryController";
import { requireAuth } from "../middleware/auth.middleware";

const router = express.Router();

router.use(requireAuth);
router.get("/categories", getCategories);
router.get("/", getInventory);
router.post("/transactions", addStockTransaction);
router.get("/ledger/:inventoryId", getLedger);
router.post("/items", createNewItem);
router.delete("/:id", deleteInventoryItem);

export default router;