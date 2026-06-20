import mongoose, { Schema } from "mongoose";

const ItemSchema = new Schema({
  itemCode: { type: String, required: true, unique: true, trim: true },
  itemName: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: ["Duplex", "Reel", "PrintedPaper", "FinishedGood"]
  },
  category: { type: String, required: true, trim: true },
  specifications: {
    gsm: { type: Number },
    dimensions: { type: String },
    ply: { type: String },
    flute: { type: String }
  },
  unitOfMeasure: { type: String, required: true, trim: true }
});

export default mongoose.model("Item", ItemSchema);
