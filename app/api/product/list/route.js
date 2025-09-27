import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

// Handle CORS preflight requests
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    console.log('🔍 Product list API called with slug:', slug);

    if (slug) {
      const product = await Product.findOne({ slug });
      console.log('📦 Found product:', product ? 'Yes' : 'No');
      
      if (!product) {
        return NextResponse.json(
          { success: false, message: "Product not found" }, 
          { 
            status: 404,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }
      return NextResponse.json(
        { success: true, product },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Fallback: return all products if slug not provided
    const allProducts = await Product.find({});
    console.log('📦 Found products count:', allProducts.length);
    
    return NextResponse.json(
      { success: true, products: allProducts },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (err) {
    console.error('❌ Product list API error:', err);
    return NextResponse.json(
      { success: false, message: err.message || "Error fetching products" }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}
