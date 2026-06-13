import { Request, Response } from "express";
import Inventory from "../models/Inventory.model";
import Item from "../models/item.model";
import StockTransaction from "../models/StockTransaction";

const STOCK_CATEGORIES = [
  "Reels Kraft",
  "Reels Semi Kraft",
  "Duplex Bundle",
  "Duplex Reel",
  "Corrugated Rolls",
  "Lamination Film",
  "Fevicol",
  "Corrugation Gum",
  "Pasting Gum",
  "Stitching Wire",
  "Strapping Bundles",
  "Printing Plates",
];

export const getCategories = async (_req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: STOCK_CATEGORIES,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInventory = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    let filter = {};
    if (category && category !== "All") {
      const itemIds = await Item.find({ category }).select("_id");
      filter = { itemRef: { $in: itemIds.map((i) => i._id) } };
    }

    const inventory = await Inventory.find(filter).populate("itemRef");

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addStockTransaction = async (req: Request, res: Response) => {
  try {
    const { inventoryRef, type, quantity, referenceNumber, notes } = req.body;

    if (!inventoryRef || !type || !quantity) {
      res.status(400).json({
        success: false,
        message: "inventoryRef, type, and quantity are required",
      });
      return;
    }

    const transaction = await StockTransaction.create({
      inventoryRef,
      type,
      quantity,
      referenceNumber,
      notes,
    });

    // Update inventory stock
    const stockChange = type === "IN" ? quantity : -quantity;
    const update: any = { $inc: { currentStock: stockChange } };
    if (type === "IN") {
      update.lastRestockedDate = new Date();
    }
    await Inventory.findByIdAndUpdate(inventoryRef, update);

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLedger = async (req: Request, res: Response) => {
  try {
    const { inventoryId } = req.params;
    const transactions = await StockTransaction.find({
      inventoryRef: inventoryId,
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNewItem = async (req: Request, res: Response) => {
  try {
    const {
      itemCode,
      itemName,
      type,
      category,
      specifications,
      unitOfMeasure,
      warehouseLocation,
      initialStock,
      reorderLevel,
    } = req.body;

    if (!itemCode || !itemName) {
      res.status(400).json({
        success: false,
        message: "itemCode and itemName are required",
      });
      return;
    }

    // Create the item
    const item = await Item.create({
      itemCode,
      itemName,
      type,
      category,
      specifications: specifications || {},
      unitOfMeasure,
    });

    // Create inventory record
    const inventory = await Inventory.create({
      itemRef: item._id,
      warehouseLocation: warehouseLocation || "Unassigned",
      currentStock: Number(initialStock) || 0,
      reservedStock: 0,
      reorderLevel: Number(reorderLevel) || 0,
      lastRestockedDate: new Date(),
      batchNumber: "INITIAL-STOCK",
    });

    // Populate itemRef for the response
    const populated = await Inventory.findById(inventory._id).populate(
      "itemRef"
    );

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
      return;
    }

    // Delete related stock transactions
    await StockTransaction.deleteMany({ inventoryRef: id });

    // Delete the Item master record
    await Item.findByIdAndDelete(inventory.itemRef);

    // Delete the inventory record
    await Inventory.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Inventory item and related data deleted",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};