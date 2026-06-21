import { Request, Response } from "express";
import Dispatch from "../../models/dispatch.model";
import Inventory from "../../models/Inventory.model";
import StockTransaction from "../../models/StockTransaction";

async function nextDispatchNumber() {
  const year = new Date().getFullYear();
  const count = await Dispatch.countDocuments({
    dispatchNo: { $regex: `^DISP-${year}-` },
  });
  return `DISP-${year}-${String(count + 1).padStart(3, "0")}`;
}

export const getDispatches = async (_req: Request, res: Response) => {
  try {
    const dispatches = await Dispatch.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: dispatches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDispatch = async (req: Request, res: Response) => {
  try {
    const {
      dispatchDate,
      customerName,
      customerAddress,
      senderName,
      items,
      consumedMaterialId,
      consumedWeight,
      sourceOrderRef,
    } = req.body;

    if (!dispatchDate || !customerName || !customerAddress || !senderName) {
      res.status(400).json({
        success: false,
        message: "dispatchDate, customerName, customerAddress, and senderName are required",
      });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one dispatch item is required",
      });
      return;
    }

    if (consumedMaterialId && Number(consumedWeight) > 0) {
      const inventory = await Inventory.findById(consumedMaterialId).populate("itemRef");
      if (!inventory) {
        res.status(404).json({ success: false, message: "Consumed inventory item not found" });
        return;
      }

      const qty = Number(consumedWeight);
      if (inventory.currentStock < qty) {
        const name = (inventory.itemRef as any)?.itemName || "Selected material";
        res.status(400).json({
          success: false,
          message: `Insufficient stock. "${name}" has ${inventory.currentStock}, but ${qty} required.`,
        });
        return;
      }

      await Inventory.findByIdAndUpdate(consumedMaterialId, {
        $inc: { currentStock: -qty },
      });

      await StockTransaction.create({
        inventoryRef: consumedMaterialId,
        type: "OUT",
        quantity: qty,
        referenceNumber: customerName,
        notes: `Dispatch material consumption for ${customerName}`,
      });
    }

    const dispatch = await Dispatch.create({
      dispatchNo: await nextDispatchNumber(),
      dispatchDate,
      customerName,
      customerAddress,
      senderName,
      items,
      sourceOrderRef: sourceOrderRef || null,
      status: "Pending",
    });

    res.status(201).json({ success: true, data: dispatch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDispatchStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["Pending", "Dispatched", "Delivered"];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const dispatch = await Dispatch.findByIdAndUpdate(id, { status }, { new: true });
    if (!dispatch) {
      res.status(404).json({ success: false, message: "Dispatch not found" });
      return;
    }

    res.status(200).json({ success: true, data: dispatch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
