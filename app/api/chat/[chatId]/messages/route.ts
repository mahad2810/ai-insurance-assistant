import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/mongodb";
import { ChatSession, Message } from "@/lib/models";
import { authOptions } from "../../../auth/[...nextauth]/route";

// Get messages for a specific chat session
export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { chatId } = params;

    await dbConnect();

    // Verify chat session ownership
    const chatSession = await ChatSession.findOne({ chatId, userId });
    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    // Get messages for this chat
    const messages = await Message.find({ chatId })
      .sort({ timestamp: 1 })
      .lean();

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}

// Add a message to a chat session
export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { chatId } = params;
    const { content, sender } = await req.json();

    if (!content || !sender) {
      return NextResponse.json(
        { error: "Message content and sender are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify chat session ownership
    const chatSession = await ChatSession.findOne({ chatId, userId });
    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    // Create new message
    const messageId = uuidv4();
    const newMessage = await Message.create({
      messageId,
      chatId,
      content,
      sender,
      timestamp: new Date(),
    });

    // Update chat session's updatedAt timestamp
    await ChatSession.updateOne(
      { chatId, userId },
      { updatedAt: new Date() }
    );

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Failed to add message:", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
} 