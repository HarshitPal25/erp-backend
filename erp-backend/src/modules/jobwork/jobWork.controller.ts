import JobWork from "../../models/jobWork.model";
import Inventory from "../../models/Inventory.model";
import Item from "../../models/item.model";
import StockTransaction from "../../models/StockTransaction";

/**
 * GET /api/jobwork
 * List all jobs — pending first, completed at end, newest first within groups.
 */
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

/**
 * POST /api/jobwork
 * Create a new job.
 * 1. Validate stock >= quantity
 * 2. Deduct stock from inventory
 * 3. Create StockTransaction OUT
 */
export const createJobWork = async (req: any, res: any) => {
  try {
    const { jobNumber, jobType, inventoryRef, quantity } = req.body;

    if (!jobNumber || !jobType || !inventoryRef || !quantity) {
      return res.status(400).json({
        success: false,
        message: "jobNumber, jobType, inventoryRef, and quantity are required",
      });
    }

    if (!["Printed", "Printed+SpotUV"].includes(jobType)) {
      return res.status(400).json({
        success: false,
        message: "jobType must be 'Printed' or 'Printed+SpotUV'",
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

/**
 * PATCH /api/jobwork/:id/complete
 * Complete a job.
 * 1. Find or create the output Item (e.g. "Printed (Kraft Reel 150 GSM)")
 * 2. Find or create the output Inventory record
 * 3. Add quantity to output inventory stock
 * 4. Create StockTransaction IN for output
 * 5. Mark job as Completed
 */
export const completeJobWork = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const job = await JobWork.findById(id).populate({
      path: "inventoryRef",
      populate: { path: "itemRef" },
    });

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

    const sourceItem = (job.inventoryRef as any)?.itemRef as any;
    const sourceInventory = job.inventoryRef as any;

    // Build the output item name
    const outputItemName = `${job.jobType} (${job.materialName})`;

    // Find or create the output Item
    let outputItem = await Item.findOne({ itemName: outputItemName });
    if (!outputItem) {
      // Generate a unique item code
      const codeBase = job.jobType === "Printed" ? "PRT" : "PRTUV";
      const count = await Item.countDocuments({ itemName: { $regex: `^${job.jobType}` } });
      const itemCode = `${codeBase}-${String(count + 1).padStart(3, "0")}`;

      outputItem = await Item.create({
        itemCode,
        itemName: outputItemName,
        type: "FinishedGood",
        category: job.jobType === "Printed" ? "Printed Stock" : "Printed+SpotUV Stock",
        specifications: sourceItem?.specifications || {},
        unitOfMeasure: sourceItem?.unitOfMeasure || "Sheets",
      });
    }

    // Find or create inventory record for this output item
    let outputInventory = await Inventory.findOne({ itemRef: outputItem._id });
    if (!outputInventory) {
      outputInventory = await Inventory.create({
        itemRef: outputItem._id,
        warehouseLocation: sourceInventory?.warehouseLocation || "Production",
        currentStock: 0,
        reservedStock: 0,
        reorderLevel: 0,
        lastRestockedDate: new Date(),
        batchNumber: `JOB-${job.jobNumber}`,
      });
    }

    // Add quantity to output inventory
    await Inventory.findByIdAndUpdate(outputInventory._id, {
      $inc: { currentStock: job.quantity },
      lastRestockedDate: new Date(),
    });

    // Create IN transaction for output
    await StockTransaction.create({
      inventoryRef: outputInventory._id,
      type: "IN",
      quantity: job.quantity,
      referenceNumber: job.jobNumber,
      notes: `Job Work ${job.jobNumber} completed — ${job.quantity} units of ${outputItemName} produced`,
    });

    // Mark job completed
    job.status = "Completed";
    job.outputInventoryRef = outputInventory._id;
    await job.save();

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
    res.status(500).json({ success: false, message: error.message });
  }
};
