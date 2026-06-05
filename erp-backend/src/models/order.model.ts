import mongoose, { Schema } from "mongoose";

const RateCalculationSchema = new Schema(
  {
    boxType: { type: String, required: true },
    dimensions: {
      length: Number,
      breadth: Number,
      height: Number,
      rollSize: Number,
      cutSize: Number
    },
    materialSpecs: {
      duplexGsm: Number,
      duplexWeightKg: Number,
      duplexRatePerKg: Number,
      rollWeightKg: Number,
      rollRatePerKg: Number
    },
    processCosts: {
      printingCost: Number,
      laminationCost: Number,
      makingCost: Number,
      cartagePerKg: Number
    },
    costSummary: {
      totalMaterialCost: Number,
      totalProductionCost: Number,
      costPerBox: Number,
      profitMargin: Number,
      finalSellingPrice: Number
    }
  },
  { _id: false }
);

const OrderItemSchema = new Schema(
  {
    itemRef: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number },
    rateCalculation: RateCalculationSchema
  },
  { _id: false }
);

const OrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true, trim: true },
  customerRef: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  orderDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date },
  items: { type: [OrderItemSchema], required: true },
  totalValue: { type: Number, default: 0 },
  status: {
    type: String,
    default: "Pending",
    enum: ["Pending", "In-Production", "Ready for Dispatch", "Dispatched"]
  },
  paymentStatus: { type: String }
});

export default mongoose.model("Order", OrderSchema);
