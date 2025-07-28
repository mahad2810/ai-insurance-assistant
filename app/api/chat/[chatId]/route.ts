import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import { ChatSession, Message } from "@/lib/models";
import { authOptions } from "../../auth/[...nextauth]/route";

// Get a specific chat session and its messages
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

    // Get the chat session
    const chatSession = await ChatSession.findOne({ chatId, userId }).lean();

    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    // Get the messages for this chat session
    const messages = await Message.find({ chatId })
      .sort({ timestamp: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      chatSession,
      messages,
    });
  } catch (error) {
    console.error("Failed to fetch chat session:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat session" },
      { status: 500 }
    );
  }
}

// Update a chat session
export async function PUT(
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
    const { title } = await req.json();

    await dbConnect();

    // Verify ownership
    const chatSession = await ChatSession.findOne({ chatId, userId });
    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    // Update the chat session
    const updatedChatSession = await ChatSession.findOneAndUpdate(
      { chatId, userId },
      { title, updatedAt: new Date() },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      chatSession: updatedChatSession,
    });
  } catch (error) {
    console.error("Failed to update chat session:", error);
    return NextResponse.json(
      { error: "Failed to update chat session" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific chat session
export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { chatId } = params;

    await dbConnect();

    // Verify ownership and delete the chat session
    const chatSession = await ChatSession.findOne({ chatId, userId });
    if (!chatSession) {
      return NextResponse.json(
        { success: false, error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Delete the chat session and its messages
    await ChatSession.deleteOne({ chatId, userId });
    await Message.deleteMany({ chatId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting chat ${params.chatId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}