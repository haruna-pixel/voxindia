import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

function generateSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      name,
      description,
      category,
      price,
      offerPrice,
      perSqFtPrice,
      perPanelSqFt,
      imageUrls,
      variants
    } = body;

    let slug = generateSlug(name);
    let existingProduct = await Product.findOne({ slug });
    let counter = 1;

    while (existingProduct) {
      slug = `${generateSlug(name)}-${counter++}`;
      existingProduct = await Product.findOne({ slug });
    }

    const userId = body.userId || "admin"; // handle user correctly based on session/auth.

    const newProduct = await Product.create({
      userId,
      name,
      slug,
      description,
      category,
      price,
      offerPrice,
      perSqFtPrice,
      perPanelSqFt,
      image: imageUrls,
      variants
    });

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
      slug: newProduct.slug,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
