import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';

// Sample chats for demonstration (in a real app, this would come from a database)
const sampleChats = [
  {
    id: '1',
    title: 'Health Insurance Coverage',
    createdAt: new Date('2023-10-05T10:30:00Z'),
    updatedAt: new Date('2023-10-05T10:45:00Z'),
    messageCount: 4
  },
  {
    id: '2',
    title: 'Auto Insurance Claim',
    createdAt: new Date('2023-10-04T14:20:00Z'),
    updatedAt: new Date('2023-10-04T14:35:00Z'),
    messageCount: 6
  },
  {
    id: '3',
    title: 'Life Insurance Policy',
    createdAt: new Date('2023-10-02T09:15:00Z'),
    updatedAt: new Date('2023-10-02T09:30:00Z'),
    messageCount: 3
  }
];

// GET - Get all chat sessions for a user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    // In a real app, you'd query your database for user's chats
    // For now, we'll return sample chats
    return NextResponse.json({
      success: true,
      chats: sampleChats
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch chats' }, { status: 500 });
  }
}

// POST - Create a new chat session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    // In a real app, you'd create a new chat in your database
    // For now, we'll return a new chat ID
    const newChatId = uuidv4();
    
    return NextResponse.json({
      success: true,
      chatId: newChatId
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ success: false, error: 'Failed to create chat' }, { status: 500 });
  }
} 