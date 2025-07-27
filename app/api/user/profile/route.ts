import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";
import { authOptions } from "../../auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

// Get user profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    await dbConnect();

    const user = await User.findOne({ userId }).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        ...user.toObject(),
        fullName: user.fullName,
        fullAddress: user.fullAddress
      }
    });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const updateData = await req.json();
    
    await dbConnect();

    // Remove sensitive fields that shouldn't be updated via this endpoint
    const { password, userId: _, providers, stats, ...allowedUpdates } = updateData;

    const user = await User.findOneAndUpdate(
      { userId },
      { 
        ...allowedUpdates,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: {
        ...user.toObject(),
        fullName: user.fullName,
        fullAddress: user.fullAddress
      }
    });
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}