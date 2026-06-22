import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import Item from "./models/item.model";

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  try {
    await Item.syncIndexes();
  } catch (err) {
    console.error("Item.syncIndexes() failed (continuing to start server):", err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});