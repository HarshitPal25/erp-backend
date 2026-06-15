import Order from "../../models/order.model";

// Helper: flatten nested order doc into a flat object for the frontend
function flattenOrder(o: any) {
  return {
    _id: o._id,
    orderNumber: o.orderInfo?.orderNumber || o.orderNumber || "—",
    customerName: o.orderInfo?.customerName || o.customerName || "—",
    itemName: o.orderInfo?.itemName || o.itemName || "—",
    quantityOrdered: o.orderInfo?.quantityOrdered || o.quantityOrdered || 0,
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

export const createOrder = async (req: any, res: any) => {
  try {
    const body = req.body;

    // Map flat frontend fields into the nested schema structure
    const orderDoc = {
      orderInfo: {
        orderNumber: body.orderNumber,
        customerName: body.customerName,
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
      status: "Pending",
    };

    const order = await Order.create(orderDoc);

    res.status(201).json({
      success: true,
      data: flattenOrder(order.toObject()),
    });
  } catch (error: any) {
    res.status(500).json({
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

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: flattenOrder(order),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};