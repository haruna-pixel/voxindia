import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // phone number is the ID
  name: { type: String },
  email: { type: String, required: true, unique: true },
  imageUrl: { type: String, default: "" },
  cartItems: { type: Object, default: {} },
}, { minimize: false });

const User = mongoose.models.user || mongoose.model("user", userSchema);
export default User;
