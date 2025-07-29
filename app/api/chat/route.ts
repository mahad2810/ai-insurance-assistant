import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import { ChatSession } from "@/lib/models";

// Sample chats for demonstration (in a real app, this would come from a database)
const sampleChats = [
  {
    chatId: '1',
    title: 'Health Insurance Coverage',
    createdAt: new Date('2023-10-05T10:30:00Z').toISOString(),
    updatedAt: new Date('2023-10-05T10:45:00Z').toISOString(),
    messageCount: 4
  },
  {
    chatId: '2',
    title: 'Auto Insurance Claim',
    createdAt: new Date('2023-10-04T14:20:00Z').toISOString(),
    updatedAt: new Date('2023-10-04T14:35:00Z').toISOString(),
    messageCount: 6
  },
  {
    chatId: '3',
    title: 'Life Insurance Policy',
    createdAt: new Date('2023-10-02T09:15:00Z').toISOString(),
    updatedAt: new Date('2023-10-02T09:30:00Z').toISOString(),
    messageCount: 3
  }
];

// GET - Get all chat sessions for a user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await dbConnect();
    
    // Fetch chats for the specific user
    const chatSessions = await ChatSession.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      chatSessions
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch chats' }, { status: 500 });
  }
}

// POST - Create a new chat session
export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    
    // Get session for authenticated users
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Check authentication
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const newChatId = uuidv4();
    let chatTitle = title || 'New Chat';
    
    // Create a persistent chat session
    await dbConnect();
    const newChatSession = await ChatSession.create({
      chatId: newChatId,
      userId: userId,
      title: chatTitle,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0
    });

    return NextResponse.json({
      success: true,
      chatSession: newChatSession
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ success: false, error: 'Failed to create chat' }, { status: 500 });
  }
}