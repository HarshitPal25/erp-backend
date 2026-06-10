import mongoose from "mongoose";

const StockTransactionSchema = new mongoose.Schema(
  {
    inventoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },

    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    referenceNumber: {
      type: String,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "StockTransaction",
  StockTransactionSchema
);