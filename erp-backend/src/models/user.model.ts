import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["Admin", "Sales", "Production", "Dispatch", "Manager"]
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

export default mongoose.model("User", UserSchema);
