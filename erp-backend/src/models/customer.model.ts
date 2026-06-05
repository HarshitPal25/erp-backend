import mongoose, { Schema } from "mongoose";

const CustomerSchema = new Schema({
  companyName: { type: String, required: true, trim: true },
  contactPerson: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  gstNumber: { type: String, trim: true },
  billingAddress: { type: String, trim: true },
  shippingAddress: { type: String, trim: true },
  creditLimit: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 }
});

export default mongoose.model("Customer", CustomerSchema);
