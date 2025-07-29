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
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Suspense fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300 text-sm">Loading your chat...</p>
          </div>
        </div>
      }>
        <ChatPageContent />
      </Suspense>
    </div>
  );
}
