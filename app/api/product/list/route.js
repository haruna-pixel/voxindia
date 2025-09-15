import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (slug) {
      const product = await Product.findOne({ slug });
      if (!product) {
        return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, product });
    }

    // Fallback: return all products if slug not provided
    const allProducts = await Product.find({});
    return NextResponse.json({ success: true, products: allProducts });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || "Error fetching products" }, { status: 500 });
  }
}
