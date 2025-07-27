"use client"

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Trash2, ArrowRight, CalendarClock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ChatSession {
  chatId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchChatSessions();
    }
  }, [status, router]);

  const fetchChatSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat");
      const data = await response.json();
      
      if (data.success && data.chatSessions) {
        setChatSessions(data.chatSessions);
      } else {
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive",
          open: true
        });
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
        open: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    // Set deleting state for this chat
    setIsDeleting(prev => ({ ...prev, [chatId]: true }));
    
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the chat from the list
        setChatSessions(prev => prev.filter(chat => chat.chatId !== chatId));
        toast({
          title: "Chat deleted",
          description: "Chat history has been deleted successfully",
          open: true
        });
      } else {
        throw new Error(data.error || "Failed to delete chat");
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat history",
        variant: "destructive",
        open: true
      });
    } finally {
      // Clear deleting state
      setIsDeleting(prev => ({ ...prev, [chatId]: false }));
    }
  };

  const filteredSessions = chatSessions.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading your chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">Chat History</h1>
        <p className="text-gray-400">View and manage your previous chat sessions</p>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search chat sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/20"
          />
        </div>
      </div>
      
      {filteredSessions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((chat) => (
            <Card key={chat.chatId} className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-blue-500/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white truncate">{chat.title}</CardTitle>
                <CardDescription className="flex items-center">
                  <CalendarClock className="h-3 w-3 mr-1" />
                  {new Date(chat.updatedAt).toLocaleDateString()} at {new Date(chat.updatedAt).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center bg-white/10 rounded-md px-3 py-2">
                  <MessageSquare className="h-4 w-4 text-blue-400 mr-2" />
                  <p className="text-sm text-gray-300">Chat session</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => deleteChat(chat.chatId)}
                  disabled={isDeleting[chat.chatId]}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  {isDeleting[chat.chatId] ? (
                    <div className="w-4 h-4 border-t-2 border-red-500 rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
                <Link href={`/chat?id=${chat.chatId}`}>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg">
          {searchTerm ? (
            <>
              <h3 className="text-xl font-medium text-white mb-2">No matching chats found</h3>
              <p className="text-gray-400 mb-4">Try a different search term</p>
              <Button variant="outline" onClick={() => setSearchTerm("")} className="bg-white/5 hover:bg-white/10 text-white">
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-medium text-white mb-2">No chat history yet</h3>
              <p className="text-gray-400 mb-4">Start a new conversation to see your history here</p>
              <Link href="/chat">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Start New Chat
                  <MessageSquare className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
} 