import mongoose, { Schema } from "mongoose";

const DispatchItemSchema = new Schema(
  {
    id: { type: String, required: true },
    itemName: { type: String, required: true, trim: true },
    brand: { type: String, default: "", trim: true },
    boxName: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const DispatchSchema = new Schema(
  {
    dispatchNo: { type: String, required: true, unique: true, trim: true },
    dispatchDate: { type: String, required: true },
    customerName: { type: String, required: true, trim: true },
    customerAddress: { type: String, required: true, trim: true },
    senderName: { type: String, required: true, trim: true },
    items: { type: [DispatchItemSchema], default: [] },
    status: {
      type: String,
      enum: ["Pending", "Dispatched", "Delivered"],
      default: "Pending",
    },
    sourceOrderRef: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Dispatch", DispatchSchema);
