"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MessageSquare, 
  Plus, 
  Calendar, 
  Search, 
  Trash2, 
  FileText,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import EditableProfile from "@/components/editable-profile";
import MobileAuthGuard from "@/components/mobile-auth-guard";

interface ChatSession {
  chatId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (data.success) {
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    setUserProfile(updatedProfile);
  };

  // Remove the manual redirect logic since MobileAuthGuard handles it

  useEffect(() => {
    if (status === "authenticated") {
      fetchChatSessions();
      fetchUserProfile();
    }
  }, [status]);

  useEffect(() => {
    const filtered = chatSessions.filter(session =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSessions(filtered);
  }, [searchQuery, chatSessions]);

  const fetchChatSessions = async () => {
    try {
      const response = await fetch("/api/chat");
      const data = await response.json();
      
      if (data.success) {
        setChatSessions(data.chatSessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push(`/chat?id=${data.chatSession.chatId}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to create new chat",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setChatSessions(prev => prev.filter(session => session.chatId !== chatId));
        toast({
          title: "Success",
          description: "Chat deleted successfully",
        });
      } else {
        throw new Error("Failed to delete chat");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MobileAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-6 sm:py-8 pt-20 sm:pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-white font-bold text-xl sm:text-2xl">AI</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent leading-tight">
            Welcome back{userProfile?.firstName ? `, ${userProfile.firstName}` : ''}!
          </h1>
          <p className="text-gray-300 text-base sm:text-lg mb-6 max-w-2xl mx-auto px-4">
            Manage your insurance document analysis and chat history
          </p>
          <Button
            onClick={createNewChat}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-8 text-base font-semibold"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Query
          </Button>
        </motion.div>

        {/* Editable User Profile */}
        {userProfile && (
          <div className="mb-8">
            <EditableProfile
              userProfile={userProfile}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="glass hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Total Chats</CardTitle>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-white">{chatSessions.length}</div>
                <p className="text-xs text-gray-400 mt-1">Total conversations</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="glass hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">This Week</CardTitle>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Calendar className="h-4 w-4 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {chatSessions.filter(session => {
                    const sessionDate = new Date(session.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return sessionDate > weekAgo;
                  }).length}
                </div>
                <p className="text-xs text-gray-400 mt-1">Recent activity</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Card className="glass hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Documents Analyzed</CardTitle>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FileText className="h-4 w-4 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-white">{chatSessions.length}</div>
                <p className="text-xs text-gray-400 mt-1">Files processed</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Chat History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Card className="glass shadow-xl border-white/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Chat History
              </CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                View and manage your previous insurance document analyses
              </CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 h-12 text-base focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                    <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    {searchQuery ? "No matching chats found" : "No chats yet"}
                  </h3>
                  <p className="text-gray-300 mb-6 text-sm sm:text-base max-w-md mx-auto">
                    {searchQuery
                      ? "Try adjusting your search terms to find what you're looking for"
                      : "Start by creating your first insurance document analysis and unlock AI-powered insights"
                    }
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={createNewChat}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-8 text-base font-semibold"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Create Your First Query
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {filteredSessions.map((session, index) => (
                    <motion.div
                      key={session.chatId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 sm:p-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl shadow-lg">
                          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate text-sm sm:text-base">
                            {session.title}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-400 truncate">
                              {formatDate(session.updatedAt)}
                            </span>
                            {session.messageCount && (
                              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30 hidden sm:inline-flex">
                                {session.messageCount} messages
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <Link href={`/chat?id=${session.chatId}`}>
                          <Button variant="ghost" size="sm" className="hover:bg-white/10 p-2 sm:p-3 rounded-lg">
                            <ArrowRight className="h-4 w-4 text-blue-400" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteChat(session.chatId)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 sm:p-3 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
    </MobileAuthGuard>
  );
}
