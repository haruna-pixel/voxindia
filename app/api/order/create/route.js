// app/api/order/create/route.js

import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    await connectDB();

    // — Try to get Clerk userId, fall back to null —
    let userId = null;
    try {
      userId = getAuth(request).userId || null;
    } catch {
      userId = null;
    }

    // — Parse the JSON body —
    const {
      address,
      items,
      paymentMethod,
      totalAmount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    // — Basic sanity checks —
    if (
      !address ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !paymentMethod ||
      !totalAmount
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid order data" },
        { status: 400 }
      );
    }

    // — Build your items array for Mongo —
    const parsedItems = items.map((item) => {
      // item.product may be either:
      //   "someMongoId"            (if front-end already split)
      // or
      //   "someMongoId|variantId|colorName"
      //
      // We'll split on '|' and pull them apart:
      const raw = item.product || item.productId || "";
      const [prodId, variantId = "", colorName = ""] = raw.split("|");

      // — Validate the real prodId —
      if (!mongoose.Types.ObjectId.isValid(prodId)) {
        throw new Error(`Invalid product ID: ${prodId}`);
      }

      return {
        product: prodId,    // Mongoose will cast this to ObjectId
        variant: variantId,
        color: colorName,
        quantity: item.quantity,
      };
    });

    // — Validate amount —
    const amount = Number(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // — Assemble the order document —
    const orderData = {
      userId,
      address,
      items: parsedItems,
      paymentMethod,
      amount,
      status: paymentMethod === "cod" ? "Pending" : "Paid",
    };

    // — If it's a Razorpay payment, include those fields —
    if (paymentMethod !== "cod") {
      orderData.razorpayOrderId   = razorpay_order_id;
      orderData.razorpayPaymentId = razorpay_payment_id;
      orderData.razorpaySignature = razorpay_signature;
    }

    // — Create & save —
    const order = await Order.create(orderData);

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order,
      orderId: order.sequentialId, // Include the sequential order ID
      razorpayOrderId: order.razorpayOrderId || null,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}