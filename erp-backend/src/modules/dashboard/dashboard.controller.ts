import { Request, Response } from "express";
import Order from "../../models/order.model";
import Inventory from "../../models/Inventory.model";
import Item from "../../models/item.model";

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    // Total orders this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalOrdersThisMonth = await Order.countDocuments({
      createdAt: { $gte: startOfMonth },
    });
    const totalOrdersLastMonth = await Order.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    // Active production (orders "In Production")
    const activeProduction = await Order.countDocuments({
      status: "In Production",
    });

    // Inventory stats
    const inventoryRecords = await Inventory.find().populate("itemRef");
    const totalInventoryItems = inventoryRecords.length;
    const categories = await Item.distinct("category");
    const lowStockItems = inventoryRecords.filter(
      (r) => r.currentStock <= r.reorderLevel
    );

    // Pending deliveries (orders not yet completed, dispatched, or cancelled)
    const pendingDeliveries = await Order.countDocuments({
      status: { $in: ["Pending", "Approved", "In Production"] },
    });

    // Calculate trend percentages
    const orderTrendPercent =
      totalOrdersLastMonth > 0
        ? Math.round(
            ((totalOrdersThisMonth - totalOrdersLastMonth) /
              totalOrdersLastMonth) *
              100
          )
        : totalOrdersThisMonth > 0
        ? 100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalOrders: {
          value: totalOrdersThisMonth,
          sub: "This month",
          trend: orderTrendPercent >= 0 ? "up" : "down",
          trendLabel:
            orderTrendPercent >= 0
              ? `+${orderTrendPercent}% from last month`
              : `${orderTrendPercent}% from last month`,
        },
        activeProduction: {
          value: activeProduction,
          sub: "Jobs in progress",
          trend: activeProduction > 0 ? "up" : "neutral",
          trendLabel:
            activeProduction > 0
              ? `${activeProduction} active jobs`
              : "No active jobs",
        },
        inventoryItems: {
          value: totalInventoryItems,
          sub: `Across ${categories.length} categories`,
          trend: lowStockItems.length > 0 ? "down" : "up",
          trendLabel:
            lowStockItems.length > 0
              ? `${lowStockItems.length} items low on stock`
              : "All items well stocked",
        },
        pendingDeliveries: {
          value: pendingDeliveries,
          sub: "Awaiting dispatch",
          trend: pendingDeliveries > 0 ? "neutral" : "up",
          trendLabel:
            pendingDeliveries > 0
              ? `${pendingDeliveries} pending`
              : "All dispatched",
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Handle both flat and nested order data formats
    const formatted = orders.map((o: any) => ({
      _id: o._id,
      orderNumber: o.orderInfo?.orderNumber || o.orderNumber || "—",
      customerName: o.orderInfo?.customerName || o.customerName || "—",
      itemName: o.orderInfo?.itemName || o.itemName || "—",
      quantityOrdered: o.orderInfo?.quantityOrdered || o.quantityOrdered || 0,
      status: o.status || "Pending",
      createdAt: o.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
