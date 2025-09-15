import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // ✅ Add this slug field
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: Number,
  offerPrice: Number,
  image: [String],
  perSqFtPrice: { type: Number, default: 0 },
  perPanelSqFt: { type: Number, default: 0 },
  variants: [{ name: String, colors: [{ name: String, price: Number, image: String }] }],
  date: { type: Date, default: Date.now },
});

const Product = mongoose.models.product || mongoose.model("product", productSchema);
export default Product;
