import mongoose, { Schema } from "mongoose";

const JobWorkSchema = new Schema(
  {
    jobNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    jobType: {
      type: String,
      required: true,
      enum: ["Printed", "Printed+SpotUV", "Printed+Laminated"],
    },

    sourceOrderRef: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    // Reference to the source inventory record
    inventoryRef: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },

    // Snapshot of material name at creation time
    materialName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },

    // Reference to the output inventory record (created on completion)
    outputInventoryRef: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("JobWork", JobWorkSchema);
