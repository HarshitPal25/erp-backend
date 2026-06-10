import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: true,
    unique: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["RawMaterial", "Consumable"],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  specifications: {
    type: Object,
    default: {},
  },
  unitOfMeasure: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Item", ItemSchema);