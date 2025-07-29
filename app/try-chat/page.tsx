"use client"

import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import ChatInterface from '@/components/chat-interface';
import { Suspense } from 'react';
import Link from 'next/link';

function TryChatContent() {
  const chatId = uuidv4(); // Always create a new chat ID for try-once sessions

  return (
    <div className="relative">
      {/* Try-once mode banner */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 p-4 text-center backdrop-blur-sm">
        <p className="text-white mb-2">You are in try-once mode. Your chat history won't be saved.</p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/signin">
            <button className="text-sm text-cyan-300 hover:text-cyan-200 underline">
              Sign in to save chats
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="text-sm text-emerald-300 hover:text-emerald-200 underline">
              Create an account
            </button>
          </Link>
        </div>
      </div>
      <div className="pt-24"> {/* Add padding to account for the banner */}
        <ChatInterface chatId={chatId} isTryOnceMode={true} />
      </div>
    </div>
  );
}

export default function TryChatPage() {
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
        <TryChatContent />
      </Suspense>
    </div>
  );
}
