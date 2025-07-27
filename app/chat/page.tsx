"use client"

import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import ChatInterface from '@/components/chat-interface';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('id') || uuidv4();

  return (
    <div className="h-screen overflow-hidden">
      <ChatInterface chatId={chatId} />
    </div>
  );
} 
