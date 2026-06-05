import mongoose, { Schema } from "mongoose";

const InventorySchema = new Schema({
  itemRef: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  warehouseLocation: { type: String, trim: true },
  currentStock: { type: Number, default: 0 },
  reservedStock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  lastRestockedDate: { type: Date },
  batchNumber: { type: String, trim: true }
});

export default mongoose.model("Inventory", InventorySchema);
