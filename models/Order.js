// models/Order.js

import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  userId: { type: String, default: null },
  address: { type: Object, required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
      productName: String,
      variant: String,
      color: String,
      quantity: Number,
    },
  ],
  paymentMethod: { type: String, required: true },
  amount: { type: Number, required: true },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
