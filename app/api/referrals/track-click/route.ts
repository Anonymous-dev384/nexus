import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Referral from "@/models/Referral"

export async function POST(request: Request) {
  try {
    const { referralCode } = await request.json()

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find referral document
    const referralDoc = await Referral.findOne({ code: referralCode })

    if (!referralDoc) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    // Increment click count
    referralDoc.clicks += 1
    await referralDoc.save()

    return NextResponse.json({
      success: true,
      clicks: referralDoc.clicks,
    })
  } catch (error: any) {
    console.error("Error tracking referral click:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
