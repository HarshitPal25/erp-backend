import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import mongoose from "mongoose";
import Item from "../models/item.model";
import Inventory from "../models/Inventory.model";
import StockTransaction from "../models/StockTransaction";

const ITEMS = [
  // Reels Kraft
  {
    item: {
      itemCode: "RK-120",
      itemName: "Kraft Reel 120 GSM",
      type: "RawMaterial",
      category: "Reels Kraft",
      specifications: { gsm: 120, dimensions: "40 inch" },
      unitOfMeasure: "KG",
    },
    inventory: {
      warehouseLocation: "Zone A - Rack 1",
      currentStock: 4500,
      reservedStock: 500,
      reorderLevel: 2000,
      lastRestockedDate: new Date("2026-05-15"),
      batchNumber: "B-2605",
    },
  },
  {
    item: {
      itemCode: "RK-150",
      itemName: "Kraft Reel 150 GSM",
      type: "RawMaterial",
      category: "Reels Kraft",
      specifications: { gsm: 150, dimensions: "44 inch" },
      unitOfMeasure: "KG",
    },
    inventory: {
      warehouseLocation: "Zone A - Rack 2",
      currentStock: 1200,
      reservedStock: 300,
      reorderLevel: 1500,
      lastRestockedDate: new Date("2026-04-20"),
      batchNumber: "B-2604",
    },
  },
  // Duplex Bundle
  {
    item: {
      itemCode: "DB-250",
      itemName: "Duplex Board 250 GSM",
      type: "RawMaterial",
      category: "Duplex Bundle",
      specifications: { gsm: 250, dimensions: "28x40 inch" },
      unitOfMeasure: "Sheets",
    },
    inventory: {
      warehouseLocation: "Zone B - Rack 1",
      currentStock: 8000,
      reservedStock: 1000,
      reorderLevel: 5000,
      lastRestockedDate: new Date("2026-06-01"),
      batchNumber: "B-2606",
    },
  },
  // Duplex Reel
  {
    item: {
      itemCode: "DR-300",
      itemName: "Duplex Reel 300 GSM",
      type: "RawMaterial",
      category: "Duplex Reel",
      specifications: { gsm: 300, dimensions: "36 inch" },
      unitOfMeasure: "KG",
    },
    inventory: {
      warehouseLocation: "Zone B - Rack 2",
      currentStock: 2500,
      reservedStock: 0,
      reorderLevel: 1000,
      lastRestockedDate: new Date("2026-06-05"),
      batchNumber: "R-300-1",
    },
  },
  // Lamination Film
  {
    item: {
      itemCode: "LF-BOPP-MAT",
      itemName: "BOPP Matte Film",
      type: "Consumable",
      category: "Lamination Film",
      specifications: { dimensions: "20 inch" },
      unitOfMeasure: "Rolls",
    },
    inventory: {
      warehouseLocation: "Zone C - Rack 3",
      currentStock: 15,
      reservedStock: 2,
      reorderLevel: 10,
      lastRestockedDate: new Date("2026-05-28"),
    },
  },
  // Fevicol
  {
    item: {
      itemCode: "FEV-MR",
      itemName: "Fevicol MR 50kg Drum",
      type: "Consumable",
      category: "Fevicol",
      specifications: {},
      unitOfMeasure: "Drums",
    },
    inventory: {
      warehouseLocation: "Liquid Store",
      currentStock: 4,
      reservedStock: 0,
      reorderLevel: 5,
      lastRestockedDate: new Date("2026-05-10"),
    },
  },
  // Stitching Wire
  {
    item: {
      itemCode: "SW-12",
      itemName: "Stitching Wire 12 Gauge",
      type: "Consumable",
      category: "Stitching Wire",
      specifications: {},
      unitOfMeasure: "Coils",
    },
    inventory: {
      warehouseLocation: "Accessories Store",
      currentStock: 120,
      reservedStock: 0,
      reorderLevel: 50,
      lastRestockedDate: new Date("2026-06-05"),
    },
  },
  // Corrugated Rolls
  {
    item: {
      itemCode: "CR-B-FLUTE",
      itemName: "Corrugated Roll B-Flute",
      type: "RawMaterial",
      category: "Corrugated Rolls",
      specifications: { flute: "B", dimensions: "42 inch" },
      unitOfMeasure: "KG",
    },
    inventory: {
      warehouseLocation: "Zone D - Rack 1",
      currentStock: 3200,
      reservedStock: 400,
      reorderLevel: 1500,
      lastRestockedDate: new Date("2026-06-08"),
      batchNumber: "CR-0608",
    },
  },
  // Strapping Bundles
  {
    item: {
      itemCode: "SB-PP-15",
      itemName: "PP Strapping 15mm",
      type: "Consumable",
      category: "Strapping Bundles",
      specifications: { dimensions: "15mm x 1000m" },
      unitOfMeasure: "Rolls",
    },
    inventory: {
      warehouseLocation: "Accessories Store",
      currentStock: 25,
      reservedStock: 0,
      reorderLevel: 10,
      lastRestockedDate: new Date("2026-06-02"),
    },
  },
  // Corrugation Gum
  {
    item: {
      itemCode: "CG-STD",
      itemName: "Corrugation Gum Standard",
      type: "Consumable",
      category: "Corrugation Gum",
      specifications: {},
      unitOfMeasure: "KG",
    },
    inventory: {
      warehouseLocation: "Liquid Store",
      currentStock: 350,
      reservedStock: 50,
      reorderLevel: 200,
      lastRestockedDate: new Date("2026-06-10"),
    },
  },
];

const TRANSACTIONS = [
  {
    itemCode: "RK-120",
    type: "IN" as const,
    quantity: 2000,
    referenceNumber: "PO-2026-045",
    date: new Date("2026-05-15"),
    notes: "Received from Agarwal Paper Mills",
  },
  {
    itemCode: "RK-120",
    type: "OUT" as const,
    quantity: 500,
    referenceNumber: "WO-2026-112",
    date: new Date("2026-05-18"),
    notes: "Issued for Production (Pizza Boxes)",
  },
  {
    itemCode: "RK-150",
    type: "OUT" as const,
    quantity: 800,
    referenceNumber: "WO-2026-115",
    date: new Date("2026-06-01"),
    notes: "Issued for Production (Master Cartons)",
  },
  {
    itemCode: "DB-250",
    type: "IN" as const,
    quantity: 3000,
    referenceNumber: "PO-2026-052",
    date: new Date("2026-06-01"),
    notes: "Bulk purchase from JK Paper",
  },
  {
    itemCode: "CR-B-FLUTE",
    type: "IN" as const,
    quantity: 1500,
    referenceNumber: "PO-2026-060",
    date: new Date("2026-06-08"),
    notes: "Monthly restock",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("MongoDB Connected");

    // Clear existing data
    await Item.deleteMany({});
    await Inventory.deleteMany({});
    await StockTransaction.deleteMany({});
    console.log("Cleared existing inventory data");

    // Create items and inventory
    const itemMap: Record<string, string> = {};
    const inventoryMap: Record<string, string> = {};

    for (const entry of ITEMS) {
      const item = await Item.create(entry.item);
      const inventory = await Inventory.create({
        ...entry.inventory,
        itemRef: item._id,
      });
      itemMap[entry.item.itemCode] = item._id.toString();
      inventoryMap[entry.item.itemCode] = inventory._id.toString();
      console.log(`  ✓ ${entry.item.itemName} (${entry.inventory.currentStock} ${entry.item.unitOfMeasure})`);
    }

    // Create transactions
    for (const txn of TRANSACTIONS) {
      const inventoryId = inventoryMap[txn.itemCode];
      if (inventoryId) {
        await StockTransaction.create({
          inventoryRef: inventoryId,
          type: txn.type,
          quantity: txn.quantity,
          referenceNumber: txn.referenceNumber,
          date: txn.date,
          notes: txn.notes,
        });
        console.log(`  ✓ ${txn.type} ${txn.quantity} - ${txn.referenceNumber}`);
      }
    }

    console.log(`\n✅ Seeded ${ITEMS.length} inventory items and ${TRANSACTIONS.length} transactions`);
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();