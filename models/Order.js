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
  sequentialId: { type: Number, unique: true }, // New field for sequential ID
});

// Pre-save middleware to generate sequential ID
OrderSchema.pre("save", async function(next) {
  if (this.isNew) {
    try {
      // Create counter collection if it doesn't exist
      const Counter = mongoose.models.Counter || mongoose.model("Counter", new mongoose.Schema({
        _id: { type: String, required: true },
        seq: { type: Number, default: 13000 } // Start from 13000
      }));
      
      // Try to find the existing counter
      let counter = await Counter.findById("order");
      
      // If no counter exists, this is the first order - create counter starting at 13000
      if (!counter) {
        console.log("Creating new counter for first order, starting at 13000");
        counter = new Counter({ _id: "order", seq: 13000 });
        await counter.save();
      }
      
      // If counter exists but is less than 13000, this might be due to previous incorrect implementation
      // Reset it to 13000 to ensure correct sequencing
      if (counter.seq < 13000) {
        console.log(`Counter was ${counter.seq}, resetting to 13000`);
        counter.seq = 13000;
        await counter.save();
      }
      
      // Assign the current counter value to sequentialId
      this.sequentialId = counter.seq;
      
      // Now increment the counter for the next order
      counter.seq += 1;
      await counter.save();
      
      console.log(`Assigned sequential ID: ${this.sequentialId}`);
      next();
    } catch (error) {
      console.error("Error in sequential ID generation:", error);
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);