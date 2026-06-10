import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema(
  {
    itemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    warehouseLocation: {
      type: String,
      required: true,
    },

    currentStock: {
      type: Number,
      default: 0,
    },

    reservedStock: {
      type: Number,
      default: 0,
    },

    reorderLevel: {
      type: Number,
      default: 0,
    },

    lastRestockedDate: {
      type: Date,
    },

    batchNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Inventory", InventorySchema);