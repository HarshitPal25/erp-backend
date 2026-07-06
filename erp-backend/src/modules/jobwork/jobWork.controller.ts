import JobWork from "../../models/jobWork.model";
import Inventory from "../../models/Inventory.model";
import Item from "../../models/item.model";
import StockTransaction from "../../models/StockTransaction";
import Order from "../../models/order.model";

function getCompletedProductionStage(jobType: string) {
  return jobType === "Printed+Laminated" ? "Printed & Laminated" : "Printed";
}

// printing prefix in the output item name, e.g. "Printed (base)" or "Printed + Laminated (base)"
function getPrintedPrefix(jobType: string) {
  if (jobType === "Printed+Laminated") return "Printed + Laminated";
  if (jobType === "Printed+SpotUV") return "Printed + Spot UV";
  return "Printed";
}

function getOutputCategory(jobType: string) {
  if (jobType === "Printed+Laminated") return "Printed + Laminated Stock";
  if (jobType === "Printed+SpotUV") return "Printed + Spot UV Stock";
  return "Printed Stock";
}


export const getJobWorks = async (req: any, res: any) => {
  try {
    const jobs = await JobWork.find()
      .populate({
        path: "inventoryRef",
        populate: { path: "itemRef" },
      })
      .populate({
        path: "outputInventoryRef",
        populate: { path: "itemRef" },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Sort: pending first, completed at end
    jobs.sort((a: any, b: any) => {
      const aCompleted = a.status === "Completed" ? 1 : 0;
      const bCompleted = b.status === "Completed" ? 1 : 0;
      if (aCompleted !== bCompleted) return aCompleted - bCompleted;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.status(200).json({ success: true, data: jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createJobWork = async (req: any, res: any) => {
  try {
    const { jobNumber, jobType, inventoryRef, quantity, sourceOrderRef } = req.body;

    if (!jobNumber || !jobType || !inventoryRef || !quantity) {
      return res.status(400).json({
        success: false,
        message: "jobNumber, jobType, inventoryRef, and quantity are required",
      });
    }

    if (!["Printed", "Printed+SpotUV", "Printed+Laminated"].includes(jobType)) {
      return res.status(400).json({
        success: false,
        message: "jobType must be 'Printed', 'Printed+SpotUV', or 'Printed+Laminated'",
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "quantity must be a positive number",
      });
    }

    // Find the source inventory and validate stock
    const inventory = await Inventory.findById(inventoryRef).populate("itemRef");
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    if (inventory.currentStock < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${inventory.currentStock}, Requested: ${qty}`,
      });
    }

    // Get material name from the Item
    const itemDoc = inventory.itemRef as any;
    const materialName = itemDoc?.itemName || itemDoc?.name || "Unknown Material";

    // Deduct stock
    await Inventory.findByIdAndUpdate(inventoryRef, {
      $inc: { currentStock: -qty },
    });

    // Create OUT transaction
    await StockTransaction.create({
      inventoryRef,
      type: "OUT",
      quantity: qty,
      referenceNumber: jobNumber,
      notes: `Job Work ${jobNumber} — ${jobType} — ${qty} units of ${materialName}`,
    });

    // Create the job
    const job = await JobWork.create({
      jobNumber,
      jobType,
      inventoryRef,
      sourceOrderRef: sourceOrderRef || null,
      materialName,
      quantity: qty,
      status: "Pending",
    });

    // Populate for response
    const populated = await JobWork.findById(job._id)
      .populate({
        path: "inventoryRef",
        populate: { path: "itemRef" },
      })
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Job number already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeJobWork = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { outputItemId, producedSheets } = req.body;

    if (!outputItemId) {
      return res.status(400).json({
        success: false,
        message: "outputItemId is required (select the finished item to produce)",
      });
    }

    const sheets = Number(producedSheets);
    if (isNaN(sheets) || sheets <= 0) {
      return res.status(400).json({
        success: false,
        message: "producedSheets must be a positive number",
      });
    }

    const job = await JobWork.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Job is already completed",
      });
    }

    // The selected item is the BASE product. The output item will be a printed variant of this base product.
    const baseItem = await Item.findById(outputItemId);
    if (!baseItem) {
      return res.status(404).json({
        success: false,
        message: "Selected item not found in Item Master",
      });
    }

    const prefix = getPrintedPrefix(job.jobType);
    const outputItemName = `${prefix} (${baseItem.itemName})`;

    // Find or create the printed-variant finished item (always in Sheets).
    let outputItem = await Item.findOne({ itemName: outputItemName });
    if (!outputItem) {
      const codeBase =
        job.jobType === "Printed+Laminated"
          ? "PRTLAM"
          : job.jobType === "Printed+SpotUV"
          ? "PRTUV"
          : "PRT";
      const count = await Item.countDocuments({ itemCode: { $regex: `^${codeBase}-` } });
      let n = count + 1;
      let itemCode = `${codeBase}-${String(n).padStart(3, "0")}`;
      while (await Item.exists({ itemCode })) {
        n++;
        itemCode = `${codeBase}-${String(n).padStart(3, "0")}`;
      }

      outputItem = await Item.create({
        itemCode,
        itemName: outputItemName,
        brand: (baseItem as any).brand,
        type: "FinishedGood",
        category: getOutputCategory(job.jobType),
        specifications: (baseItem as any).specifications || {},
        unitOfMeasure: "Sheets",
      });
    }

    // Find or create the inventory record for the printed-variant item.
    let outputInventory = await Inventory.findOne({ itemRef: outputItem._id });
    if (!outputInventory) {
      outputInventory = await Inventory.create({
        itemRef: outputItem._id,
        warehouseLocation: "Production",
        currentStock: 0,
        reservedStock: 0,
        reorderLevel: 0,
        lastRestockedDate: new Date(),
        batchNumber: `JOB-${job.jobNumber}`,
      });
    }

    // Add the produced sheets to the output inventory.
    await Inventory.findByIdAndUpdate(outputInventory._id, {
      $inc: { currentStock: sheets },
      lastRestockedDate: new Date(),
    });

    // Create IN transaction for output
    await StockTransaction.create({
      inventoryRef: outputInventory._id,
      type: "IN",
      quantity: sheets,
      referenceNumber: job.jobNumber,
      notes: `Job Work ${job.jobNumber} completed — ${sheets} sheets of ${outputItem.itemName} produced`,
    });

    // Mark job completed
    job.status = "Completed";
    job.outputInventoryRef = outputInventory._id as any;
    await job.save();

    if ((job as any).sourceOrderRef) {
      await Order.findByIdAndUpdate((job as any).sourceOrderRef, {
        productionStage: getCompletedProductionStage(job.jobType),
      });
    }

    // Return populated job
    const populated = await JobWork.findById(job._id)
      .populate({
        path: "inventoryRef",
        populate: { path: "itemRef" },
      })
      .populate({
        path: "outputInventoryRef",
        populate: { path: "itemRef" },
      })
      .lean();

    res.status(200).json({ success: true, data: populated });
  } catch (error: any) {
    console.error("completeJobWork error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
