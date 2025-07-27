"use client"

import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import ChatInterface from '@/components/chat-interface';
import { Suspense } from 'react';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('id') || uuidv4();

  return <ChatInterface chatId={chatId} />;
}

export default function ChatPage() {
  return (
    <div className="h-screen overflow-hidden">
      <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
        <ChatPageContent />
      </Suspense>
    </div>
  );
} 
