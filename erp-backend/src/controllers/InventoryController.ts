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
  "Printing Plates",
  "Printed Duplex Board",
  "Printed Kraft",
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
    const {
      inventoryRef,
      type,
      quantity,
      referenceNumber,
      notes,
      kraftReelQty,
      semiKraftReelQty,
      kraftReelInventoryId,
      semiKraftReelInventoryId,
    } = req.body;

    if (!inventoryRef || !type || !quantity) {
      res.status(400).json({
        success: false,
        message: "inventoryRef, type, and quantity are required",
      });
      return;
    }

    // Validate reel deductions if any
    const deductions: { inventoryId: string; qty: number; label: string }[] = [];
    if (type === "IN") {
      if (kraftReelInventoryId && Number(kraftReelQty) > 0) {
        deductions.push({
          inventoryId: kraftReelInventoryId,
          qty: Number(kraftReelQty),
          label: "Kraft Reel",
        });
      }
      if (semiKraftReelInventoryId && Number(semiKraftReelQty) > 0) {
        deductions.push({
          inventoryId: semiKraftReelInventoryId,
          qty: Number(semiKraftReelQty),
          label: "Semi Kraft Reel",
        });
      }

      for (const d of deductions) {
        const inv = await Inventory.findById(d.inventoryId).populate("itemRef");
        if (!inv) {
          res.status(404).json({
            success: false,
            message: `${d.label} inventory item not found`,
          });
          return;
        }
        if (inv.currentStock < d.qty) {
          const name = (inv.itemRef as any)?.itemName || d.label;
          res.status(400).json({
            success: false,
            message: `Insufficient ${d.label} stock. "${name}" has ${inv.currentStock}, but ${d.qty} required.`,
          });
          return;
        }
      }
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

    // Perform reel deductions
    for (const d of deductions) {
      await Inventory.findByIdAndUpdate(d.inventoryId, {
        $inc: { currentStock: -d.qty },
      });
      await StockTransaction.create({
        inventoryRef: d.inventoryId,
        type: "OUT",
        quantity: d.qty,
        referenceNumber: referenceNumber,
        notes: `${d.qty} ${d.label} consumed for stock IN of ${referenceNumber}`,
      });
    }

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
      kraftReelInventoryId,
      kraftReelQty,
      semiKraftReelInventoryId,
      semiKraftReelQty,
    } = req.body;

    if (!itemCode || !itemName) {
      res.status(400).json({
        success: false,
        message: "itemCode and itemName are required",
      });
      return;
    }

    // If category is Corrugated Rolls, validate and deduct from reels
    if (category === "Corrugated Rolls") {
      const deductions: { inventoryId: string; qty: number; label: string }[] = [];

      if (kraftReelInventoryId && Number(kraftReelQty) > 0) {
        deductions.push({
          inventoryId: kraftReelInventoryId,
          qty: Number(kraftReelQty),
          label: "Kraft Reel",
        });
      }

      if (semiKraftReelInventoryId && Number(semiKraftReelQty) > 0) {
        deductions.push({
          inventoryId: semiKraftReelInventoryId,
          qty: Number(semiKraftReelQty),
          label: "Semi Kraft Reel",
        });
      }

      // Validate stock for all deductions
      for (const d of deductions) {
        const inv = await Inventory.findById(d.inventoryId).populate("itemRef");
        if (!inv) {
          res.status(404).json({
            success: false,
            message: `${d.label} inventory item not found`,
          });
          return;
        }
        if (inv.currentStock < d.qty) {
          const name = (inv.itemRef as any)?.itemName || d.label;
          res.status(400).json({
            success: false,
            message: `Insufficient ${d.label} stock. "${name}" has ${inv.currentStock}, but ${d.qty} required.`,
          });
          return;
        }
      }

      // Deduct stock from reels
      for (const d of deductions) {
        await Inventory.findByIdAndUpdate(d.inventoryId, {
          $inc: { currentStock: -d.qty },
        });
        await StockTransaction.create({
          inventoryRef: d.inventoryId,
          type: "OUT",
          quantity: d.qty,
          referenceNumber: itemCode,
          notes: `${d.qty} ${d.label} consumed for Corrugated Roll: ${itemName}`,
        });
      }
    }

    let linkedReels: any = undefined;
    if (category === "Corrugated Rolls") {
      const initStockNum = Number(initialStock);
      linkedReels = {};
      if (kraftReelInventoryId && Number(kraftReelQty) > 0) {
        linkedReels.kraft = {
          inventoryId: kraftReelInventoryId,
          ratio: initStockNum > 0 ? Number(kraftReelQty) / initStockNum : 0,
        };
      }
      if (semiKraftReelInventoryId && Number(semiKraftReelQty) > 0) {
        linkedReels.semiKraft = {
          inventoryId: semiKraftReelInventoryId,
          ratio: initStockNum > 0 ? Number(semiKraftReelQty) / initStockNum : 0,
        };
      }
      if (Object.keys(linkedReels).length === 0) {
        linkedReels = undefined;
      }
    }

    // Create the item
    const item = await Item.create({
      itemCode,
      itemName,
      type,
      category,
      specifications: specifications || {},
      unitOfMeasure,
      linkedReels,
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