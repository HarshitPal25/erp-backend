import mongoose, { Schema } from "mongoose";

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    itemName: {
      type: String,
      required: true,
    },

    itemSerialNumber: String,

    dieSerialNumber: String,

    quantityOrdered: {
      type: Number,
      required: true,
    },

    boxType: String,

    printed: {
      type: Boolean,
      default: false,
    },

    laminated: {
      type: Boolean,
      default: false,
    },

    length: Number,
    breadth: Number,
    height: Number,

    sheetLength: Number,
    sheetBreadth: Number,

    ply: Number,

    gsm: Number,

    status: {
      type: String,
      default: "Pending",
      enum: [
        "Pending",
        "In-Production",
        "Ready for Dispatch",
        "Dispatched",
      ],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", OrderSchema);