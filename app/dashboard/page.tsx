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
      <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Welcome back{userProfile?.firstName ? `, ${userProfile.firstName}` : ''}!
          </h1>
          <p className="text-gray-300 text-lg">
            Manage your insurance document analysis and chat history
          </p>
          <Button
            onClick={createNewChat}
            className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatSessions.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {chatSessions.filter(session => {
                    const sessionDate = new Date(session.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return sessionDate > weekAgo;
                  }).length}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Analyzed</CardTitle>
                <FileText className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatSessions.length}</div>
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
          <Card className="glass">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Chat History</CardTitle>
              <CardDescription className="text-gray-300">
                View and manage your previous insurance document analyses
              </CardDescription>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {searchQuery ? "No matching chats found" : "No chats yet"}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {searchQuery 
                      ? "Try adjusting your search terms" 
                      : "Start by creating your first insurance document analysis"
                    }
                  </p>
                  {!searchQuery && (
                    <Button 
                      onClick={createNewChat}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Query
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.chatId}
                      className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">
                            {session.title}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {formatDate(session.updatedAt)}
                            </span>
                            {session.messageCount && (
                              <Badge variant="secondary" className="text-xs bg-white/10">
                                {session.messageCount} messages
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/chat?id=${session.chatId}`}>
                          <Button variant="ghost" size="sm" className="hover:bg-white/10">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteChat(session.chatId)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
