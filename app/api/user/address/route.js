import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Address from "@/models/Address";

export async function POST(request) {
  await connectDB();

  const body = await request.json();
  const { fullName, phoneNumber, email, gstin, pincode, area, city, state } = body;

  if (!fullName || !phoneNumber || !email || !pincode || !area || !city || !state) {
    return NextResponse.json(
      { success: false, message: "Missing required fields" },
      { status: 400 }
    );
  }

  const newAddress = new Address({ fullName, phoneNumber, email, gstin, pincode, area, city, state });
  await newAddress.save();

  return NextResponse.json({ success: true, address: newAddress });
}

export async function GET(request) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json(
      { success: false, message: "Missing phone query param" },
      { status: 400 }
    );
  }

  const addresses = await Address.find({ phoneNumber: phone });

  return NextResponse.json({ success: true, addresses });
}
