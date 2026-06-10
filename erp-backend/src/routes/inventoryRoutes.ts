import express from "express";
import {
    getInventory,
    getCategories,
} from "../controllers/InventoryController";

const router = express.Router();

router.get("/", getInventory);

router.get("/categories", getCategories);

export default router;