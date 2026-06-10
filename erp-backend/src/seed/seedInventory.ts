import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import mongoose from "mongoose";
import Item from "../models/Items";
import Inventory from "../models/Inventory";

mongoose.connect(process.env.MONGO_URI!);

async function seed() {
  await Item.deleteMany({});
  await Inventory.deleteMany({});

  const item1 = await Item.create({
    itemCode: "RK-120",
    itemName: "Kraft Reel 120 GSM",
    type: "RawMaterial",
    category: "Reels Kraft",
    specifications: {
      gsm: 120,
      dimensions: "40 inch",
    },
    unitOfMeasure: "KG",
  });

  await Inventory.create({
    itemRef: item1._id,
    warehouseLocation: "Zone A - Rack 1",
    currentStock: 4500,
    reservedStock: 500,
    reorderLevel: 2000,
    lastRestockedDate: new Date("2026-05-15"),
    batchNumber: "B-2605",
  });

  const item2 = await Item.create({
    itemCode: "RK-150",
    itemName: "Kraft Reel 150 GSM",
    type: "RawMaterial",
    category: "Reels Kraft",
    specifications: {
      gsm: 150,
      dimensions: "44 inch",
    },
    unitOfMeasure: "KG",
  });

  await Inventory.create({
    itemRef: item2._id,
    warehouseLocation: "Zone A - Rack 2",
    currentStock: 1200,
    reservedStock: 300,
    reorderLevel: 1500,
    lastRestockedDate: new Date("2026-04-20"),
    batchNumber: "B-2604",
  });

  console.log("Inventory seeded successfully");
  process.exit();
}

seed();