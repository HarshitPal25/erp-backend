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

const OrderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  itemName: { type: String, trim: true },
  itemSerialNumber: { type: String, trim: true },
  dieSerialNumber: { type: String, trim: true },
  boxType: {
    type: String,
    trim: true,
    enum: ["Pizza", "Flap", "Carton", "Ghera Patti", "Z Patti"]
  },
  printed: { type: Boolean, default: false },
  jobWorkerName: { type: String, trim: true },
  boxSize: {
    length: Number,
    breadth: Number,
    height: Number
  },
  sheetSize: {
    length: Number,
    breadth: Number
  },
  ply: { type: Number },
  gsm: { type: Number },
  quantityOrdered: { type: Number },
  laminated: { type: Boolean, default: false },
  status: { type: String, default: "Draft" },
  estimatedCost: { type: Number },
  createdAt: { type: Date, default: Date.now },
  rateCalculation: RateCalculationSchema
});

export default mongoose.model("Order", OrderSchema);
