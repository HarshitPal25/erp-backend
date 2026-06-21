import Order from "../../models/order.model";
import Inventory from "../../models/Inventory.model";
import Item from "../../models/item.model";
import StockTransaction from "../../models/StockTransaction";

// Helper: flatten nested order doc into a flat object for the frontend
function flattenOrder(o: any) {
  const qtyOrdered = o.orderInfo?.quantityOrdered || o.quantityOrdered || 0;
  const qtyDelivered = o.quantityDelivered || 0;
  return {
    _id: o._id,
    orderNumber: o.orderInfo?.orderNumber || o.orderNumber || "—",
    customerName: o.orderInfo?.customerName || o.customerName || "—",
    itemBrand: o.orderInfo?.itemBrand || o.itemBrand || "",
    itemName: o.orderInfo?.itemName || o.itemName || "—",
    quantityOrdered: qtyOrdered,
    quantityDelivered: qtyDelivered,
    quantityRemaining: Math.max(0, qtyOrdered - qtyDelivered),
    itemSerialNumber: o.boxSpecification?.itemSerialNumber || o.itemSerialNumber || "",
    dieSerialNumber: o.boxSpecification?.dieSerialNumber || o.dieSerialNumber || "",
    boxType: o.boxSpecification?.boxType || o.boxType || "",
    length: o.boxSpecification?.length || o.length || 0,
    breadth: o.boxSpecification?.breadth || o.breadth || 0,
    height: o.boxSpecification?.height || o.height || 0,
    sheetLength: o.boxSpecification?.sheetLength || o.sheetLength || 0,
    sheetBreadth: o.boxSpecification?.sheetBreadth || o.sheetBreadth || 0,
    printed: o.finishing?.printed || o.printed || false,
    laminated: o.finishing?.laminated || o.laminated || false,
    status: o.status || "Pending",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

/**
 * When an order is completed, deduct raw materials from inventory.
 * 
 * Consumption logic:
 * - Sheets consumed = quantityOrdered / boxesPerSheet
 * - Deducts from the first available Duplex inventory item
 * - If laminated, deducts lamination film sheets
 * - Deducts stitching wire (1 per box) and strapping (1 per 50 boxes)
 * 
 * Creates StockTransaction OUT records for audit trail.
 */
async function deductInventoryOnCompletion(order: any) {
  const qty = order.orderInfo?.quantityOrdered || 0;
  const boxesPerSheet = order.boxSpecification?.boxesPerSheet || 1;
  const sheetsConsumed = Math.ceil(qty / boxesPerSheet);
  const orderNumber = order.orderInfo?.orderNumber || "Unknown";
  const isLaminated = order.finishing?.laminated || false;

  // Define what materials to deduct and how much
  const deductions: { category: string; quantity: number; note: string }[] = [];

  // 1. Duplex Board — sheets consumed
  if (sheetsConsumed > 0) {
    deductions.push({
      category: "Duplex Bundle",
      quantity: sheetsConsumed,
      note: `${sheetsConsumed} sheets for ${qty} boxes (${boxesPerSheet} boxes/sheet)`,
    });
  }

  // 2. Kraft Paper / Corrugated Rolls — same sheets count for 2-ply layers
  const numPly = Number(order.twoPlyCost?.numberOfPly) || 0;
  if (numPly > 0 && sheetsConsumed > 0) {
    deductions.push({
      category: "Corrugated Rolls",
      quantity: sheetsConsumed * numPly,
      note: `${sheetsConsumed * numPly} sheets (${numPly} ply × ${sheetsConsumed} sheets)`,
    });
  }

  // 3. Lamination Film — if laminated, consume same number of sheets
  if (isLaminated && sheetsConsumed > 0) {
    deductions.push({
      category: "Lamination Film",
      quantity: sheetsConsumed,
      note: `${sheetsConsumed} sheets of lamination film`,
    });
  }

  // 4. Stitching Wire — 1 unit per box
  if (qty > 0) {
    deductions.push({
      category: "Stitching Wire",
      quantity: Math.ceil(qty / 100), // 1 unit per 100 boxes
      note: `Wire for ${qty} boxes`,
    });
  }

  // 5. Strapping Bundles — 1 per 50 boxes
  if (qty > 0) {
    deductions.push({
      category: "Strapping Bundles",
      quantity: Math.ceil(qty / 50),
      note: `Strapping for ${qty} boxes`,
    });
  }

  const results: string[] = [];

  for (const deduction of deductions) {
    try {
      // Find items in this category
      const items = await Item.find({ category: deduction.category }).select("_id");
      if (items.length === 0) continue;

      // Find the first inventory record with enough stock
      const inventory = await Inventory.findOne({
        itemRef: { $in: items.map((i) => i._id) },
        currentStock: { $gte: deduction.quantity },
      });

      if (!inventory) {
        // If no single item has enough, use the first one and let it go negative
        const fallback = await Inventory.findOne({
          itemRef: { $in: items.map((i) => i._id) },
        });
        if (!fallback) continue;

        await StockTransaction.create({
          inventoryRef: fallback._id,
          type: "OUT",
          quantity: deduction.quantity,
          referenceNumber: orderNumber,
          notes: `Order ${orderNumber} completed — ${deduction.note}`,
        });

        await Inventory.findByIdAndUpdate(fallback._id, {
          $inc: { currentStock: -deduction.quantity },
        });

        results.push(`${deduction.category}: -${deduction.quantity} (low stock warning)`);
        continue;
      }

      // Create OUT transaction
      await StockTransaction.create({
        inventoryRef: inventory._id,
        type: "OUT",
        quantity: deduction.quantity,
        referenceNumber: orderNumber,
        notes: `Order ${orderNumber} completed — ${deduction.note}`,
      });

      // Deduct from inventory
      await Inventory.findByIdAndUpdate(inventory._id, {
        $inc: { currentStock: -deduction.quantity },
      });

      results.push(`${deduction.category}: -${deduction.quantity}`);
    } catch (err) {
      // Don't fail the order status update if inventory deduction has issues
      console.error(`Inventory deduction error for ${deduction.category}:`, err);
    }
  }

  return results;
}

export const createOrder = async (req: any, res: any) => {
  console.log("========== CREATE ORDER ==========");
  console.log("BODY:");
  console.log(req.body);

  try {
    const body = req.body;

    const orderDoc = {
      orderInfo: {
        orderNumber: body.orderNumber,
        customerName: body.customerName,
        itemBrand: body.itemBrand || "",
        itemName: body.itemName,
        quantityOrdered: Number(body.quantityOrdered) || 0,
      },
      boxSpecification: {
        boxType: body.boxType || "",
        boxesPerSheet: Number(body.boxesPerSheet) || 1,
        itemSerialNumber: body.itemSerialNumber || "",
        dieSerialNumber: body.dieSerialNumber || "",
        length: Number(body.length) || 0,
        breadth: Number(body.breadth) || 0,
        height: Number(body.height) || 0,
        sheetLength: Number(body.sheetLength) || 0,
        sheetBreadth: Number(body.sheetBreadth) || 0,
      },
      finishing: {
        printed: body.printed || false,
        laminated: body.laminated || false,
      },
      twoPlyCost: {
        numberOfPly: body.numberOf2Ply || "0",
      },
      status: "Pending",
    };

    console.log("ORDER DOC:");
    console.log(orderDoc);

    const order = await Order.create(orderDoc);

    console.log("ORDER SAVED");
    console.log(order);

    return res.status(201).json({
      success: true,
      data: flattenOrder(order),
    });
  } catch (error: any) {
    console.log("========== ERROR ==========");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrders = async (req: any, res: any) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .lean();

    const flattened = orders.map(flattenOrder);

    // Sort: pending/active first, completed/dispatched/cancelled at the end
    const endStatuses = ["Completed", "Dispatched", "Cancelled"];
    flattened.sort((a, b) => {
      const aEnd = endStatuses.includes(a.status) ? 1 : 0;
      const bEnd = endStatuses.includes(b.status) ? 1 : 0;
      if (aEnd !== bEnd) return aEnd - bEnd;
      // Within same group, sort by newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.status(200).json({
      success: true,
      data: flattened,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOrderStatus = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Approved",
      "In Production",
      "Completed",
      "Dispatched",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Get the current order to check previous status
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const previousStatus = currentOrder.status;

    // Build update fields
    const updateFields: any = { status };

    // If completing, auto-set delivery to 100%
    if (status === "Completed") {
      const totalOrdered = currentOrder.orderInfo?.quantityOrdered || 0;
      updateFields.quantityDelivered = totalOrdered;
    }

    // Update the status
    const order = await Order.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).lean();

    // If transitioning TO "Completed" (and wasn't already completed), deduct inventory
    let inventoryDeductions: string[] = [];
    if (
      status === "Completed" &&
      previousStatus !== "Completed" &&
      previousStatus !== "Dispatched"
    ) {
      inventoryDeductions = await deductInventoryOnCompletion(order);
    }

    res.status(200).json({
      success: true,
      data: flattenOrder(order),
      inventoryDeductions,
    });
  } catch (error: any) {
    console.error("updateOrderStatus error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update the delivered quantity for an order.
 * If fully delivered, auto-set status to "Completed".
 */
export const updateDelivery = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { quantityDelivered } = req.body;

    if (quantityDelivered == null || isNaN(Number(quantityDelivered)) || Number(quantityDelivered) < 0) {
      return res.status(400).json({
        success: false,
        message: "quantityDelivered must be a non-negative number",
      });
    }

    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const totalOrdered = currentOrder.orderInfo?.quantityOrdered || 0;
    const delivered = Number(quantityDelivered);

    if (delivered > totalOrdered) {
      return res.status(400).json({
        success: false,
        message: `Cannot deliver more than ordered (${totalOrdered})`,
      });
    }

    const updateFields: any = { quantityDelivered: delivered };

    // Auto-complete the order if fully delivered
    const previousStatus = currentOrder.status;
    if (delivered >= totalOrdered && previousStatus !== "Completed" && previousStatus !== "Dispatched" && previousStatus !== "Cancelled") {
      updateFields.status = "Completed";
    }

    const order = await Order.findByIdAndUpdate(id, updateFields, { new: true }).lean();

    // If auto-completed, deduct inventory
    let inventoryDeductions: string[] = [];
    if (
      updateFields.status === "Completed" &&
      previousStatus !== "Completed" &&
      previousStatus !== "Dispatched"
    ) {
      inventoryDeductions = await deductInventoryOnCompletion(order);
    }

    res.status(200).json({
      success: true,
      data: flattenOrder(order),
      inventoryDeductions,
    });
  } catch (error: any) {
    console.error("updateDelivery error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
