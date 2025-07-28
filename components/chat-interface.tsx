"use client"

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Send, 
  FileText, 
  X, 
  Loader2, 
  ArrowDown,
  MessageSquare,
  Bot,
  User,
  Paperclip,
  Globe,
  Copy,
  Check,
  MoreHorizontal,
  Mic,
  Plus,
  Settings,
  Menu,
  Trash2,
  ChevronRight,
  ChevronDown,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  chatId: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ParsedPDF {
  text: string;
  chunks: string[];
  pages: number;
  filename: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

interface ChatInterfaceProps {
  chatId: string;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [parsedPDFs, setParsedPDFs] = useState<ParsedPDF[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "hi", name: "Hindi" },
    { code: "mr", name: "Marathi" },
    { code: "ja", name: "Japanese" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "ru", name: "Russian" },
  ];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle scroll to show/hide scroll button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop > clientHeight + 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatId) {
      fetchMessages();
      fetchChatSessions();
    }
  }, [chatId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${chatId}`);
      const data = await response.json();
      
      if (data.success && data.messages) {
        setMessages(data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const fetchChatSessions = async () => {
    try {
      // Replace with your actual API endpoint for fetching chat sessions
      const response = await fetch('/api/chat');
      const data = await response.json();
      
      if (data.success && data.chatSessions) {
        setChatSessions(data.chatSessions.map((chat: any) => ({
          id: chat.chatId,
          title: chat.title,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messageCount: chat.messageCount || 0
        })));
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    }
  };

  const createNewChat = async () => {
    try {
      // Replace with your actual API endpoint for creating a new chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' })
      });
      const data = await response.json();

      if (data.success && data.chatSession) {
        // Redirect to the new chat
        window.location.href = `/chat?id=${data.chatSession.chatId}`;
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const deleteChat = async (id: string) => {
    try {
      // Replace with your actual API endpoint for deleting a chat
      const response = await fetch(`/api/chat/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove from local state
        setChatSessions(prev => prev.filter(chat => chat.id !== id));
        
        // If we deleted the current chat, create a new one
        if (id === chatId) {
          createNewChat();
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  // Fix the SpeechRecognition type errors by importing the types
  // No need to modify the toast calls as they are using a preexisting pattern in the codebase

  // Fix the toast calls by adding the open property
  const showToast = (props: { title: string; description: string; variant?: "default" | "destructive" }) => {
    toast({
      ...props,
      open: true
    });
  };

  // Update all toast calls
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length !== selectedFiles.length) {
      showToast({
        title: "Invalid file type",
        description: "Please upload only PDF files",
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => [...prev, ...pdfFiles]);

    // Parse each PDF
    for (const file of pdfFiles) {
      await parsePDF(file);
    }
  };

  const parsePDF = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setParsedPDFs(prev => [
          ...prev,
          {
            text: data.text,
            chunks: data.chunks,
            pages: data.pages,
            filename: file.name,
          },
        ]);

        showToast({
          title: "PDF parsed successfully",
          description: `Extracted text from ${data.pages} pages`,
        });
      } else {
        throw new Error(data.error || "Unknown parsing error");
      }
    } catch (error) {
      console.error("PDF parsing error:", error);
      showToast({
        title: "Error parsing PDF",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const removeFile = (index: number) => {
    const removedFile = files[index];
    setFiles(prev => prev.filter((_, i) => i !== index));
    setParsedPDFs(prev => prev.filter(pdf => pdf.filename !== removedFile.name));
  };

  const translateMessage = async (messageId: string, targetLanguage: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.sender === 'user') return;
    
    setIsTranslating(true);
    
    try {
      let content = message.content;
      try {
        const parsedContent = JSON.parse(message.content);
        if (parsedContent.explanation) {
          // If it's already JSON with explanation field, we'll translate that
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: parsedContent.explanation,
              targetLang: targetLanguage
            }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Update the explanation in the parsed content
            parsedContent.explanation = data.translatedText;
            
            // Also translate details if available
            if (parsedContent.details && Array.isArray(parsedContent.details)) {
              const detailsResponse = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: parsedContent.details.join('\n'),
                  targetLang: targetLanguage
                }),
              });
              
              const detailsData = await detailsResponse.json();
              
              if (detailsData.success) {
                parsedContent.details = detailsData.translatedText.split('\n');
              }
            }
            
            // Update the message
            setMessages(prev => 
              prev.map(m => m.id === messageId 
                ? {...m, content: JSON.stringify(parsedContent)} 
                : m
              )
            );
          } else {
            throw new Error(data.error || "Translation failed");
          }
        }
      } catch (e) {
        // If parsing failed, treat as plain text
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: content,
            targetLang: targetLanguage
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setMessages(prev => 
            prev.map(m => m.id === messageId 
              ? {...m, content: data.translatedText} 
              : m
            )
          );
        } else {
          throw new Error(data.error || "Translation failed");
        }
      }
    } catch (error) {
      console.error("Translation error:", error);
      showToast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Browser compatibility check
      const SpeechRecognition = window.SpeechRecognition || window['webkitSpeechRecognition'];
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition() as SpeechRecognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        
        // Default to English, but can be changed based on user preference
        recognition.lang = selectedLanguage || "en-US";
        
        // Handle result
        recognition.onresult = async (event: SpeechRecognitionEvent) => {
          const result = event.results[0][0];
          const transcript = result.transcript;
          const confidence = result.confidence;
          
          console.log(`Voice input (${recognition.lang}): "${transcript}" (confidence: ${confidence.toFixed(2)})`);
          
          // Set the transcript as query
          setQuery(transcript);
          
          // Auto-translate if not in English and not the selected language
          if (recognition.lang !== "en-US" && recognition.lang !== selectedLanguage) {
            await translateQuery(transcript);
          }
          
          setIsListening(false);
        };
        
        // Handle errors
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          
          switch (event.error) {
            case "language-not-supported":
              recognition.lang = "en-US"; // Fallback to English
              showToast({
                title: "Language not supported",
                description: "Falling back to English",
                variant: "destructive",
              });
              break;
            case "no-speech":
              showToast({
                title: "No speech detected",
                description: "Please try speaking again",
              });
              break;
            default:
              showToast({
                title: "Voice recognition error",
                description: event.error,
                variant: "destructive",
              });
          }
          
          setIsListening(false);
        };
        
        setRecognition(recognition);
      }
    }
  }, [selectedLanguage]);
  
  // Function to start listening
  const startListening = () => {
    if (recognition) {
      try {
        // Update language based on current selection
        recognition.lang = getVoiceLanguageCode(selectedLanguage);
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        setIsListening(false);
      }
    } else {
      showToast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive",
      });
    }
  };
  
  // Function to stop listening
  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };
  
  // Helper to translate query
  const translateQuery = async (text: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang: 'en' // Always translate to English for processing
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQuery(data.translatedText);
        setDetectedLanguage(data.detectedLanguage || selectedLanguage);
        
        showToast({
          title: "Text translated",
          description: `Translated from ${data.detectedLanguage?.toUpperCase() || selectedLanguage} to English`,
        });
      } else {
        throw new Error(data.error || "Translation failed");
      }
    } catch (error) {
      console.error("Translation error:", error);
      showToast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper to get voice language code
  const getVoiceLanguageCode = (langCode: string): string => {
    const langMap: {[key: string]: string} = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'mr': 'mr-IN',
      'gu': 'gu-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'bn': 'bn-IN',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'ja': 'ja-JP',
      'zh': 'zh-CN',
      'ar': 'ar-SA',
      'ru': 'ru-RU'
    };
    
    return langMap[langCode] || 'en-US';
  };

  // Update the handleSubmit function
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!query.trim()) {
      showToast({
        title: "Missing input",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) return;

    const userMessageId = uuidv4();
    const userMessage = {
      id: userMessageId,
      chatId,
      sender: 'user' as const,
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    setQuery("");
    setIsLoading(true);

    try {
      const firstParsedPDF = parsedPDFs[0];
      
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage.content,
          pdfContent: firstParsedPDF?.text || "",
          chunks: firstParsedPDF?.chunks || [],
          chatId,
          language: selectedLanguage !== "en" ? selectedLanguage : undefined,
          detectedLanguage: detectedLanguage || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          id: uuidv4(),
          chatId,
          sender: 'assistant' as const,
          content: JSON.stringify(data),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Reset detected language after processing
        setDetectedLanguage(null);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Query error:", error);
      showToast({
        title: "Error",
        description: "Failed to process your query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // Format message content based on decision type
  const formatMessageContent = (data: any) => {
    let decision = "Unknown";
    let badgeColor = "bg-gray-500";
    
    if (data.decision === "COVERED" || data.decision === "approved") {
      decision = "Covered";
      badgeColor = "bg-green-500/70";
    } else if (data.decision === "NOT_COVERED" || data.decision === "rejected") {
      decision = "Not Covered";
      badgeColor = "bg-red-500/70";
    } else if (data.decision === "needs_review") {
      decision = "Needs Review";
      badgeColor = "bg-yellow-500/70";
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={`${badgeColor} text-white px-3 py-1 text-sm font-medium`}>
              {decision}
            </Badge>
            {data.confidence && (
              <span className="text-xs text-gray-300 bg-gray-800/50 px-2 py-1 rounded-md">
                Confidence: {Math.round(data.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
        
        {data.amount && (
          <div className="p-4 rounded-md bg-green-900/20 border-l-4 border-green-500">
            <p className="font-semibold text-green-400 text-sm">Coverage Amount</p>
            <p className="text-green-300 text-lg font-medium mt-1">{data.amount}</p>
          </div>
        )}
        
        <div className="prose prose-invert max-w-none">
          {data.explanation && (
            <Markdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mt-6 mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white/90 mt-5 mb-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-bold text-white/80 mt-4 mb-2" {...props} />,
                p: ({node, ...props}) => <p className="text-gray-200 text-sm leading-relaxed mb-3" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-200 text-sm" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 my-3" {...props} />,
                code: ({node, inline, ...props}) => 
                  inline 
                    ? <code className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded text-sm" {...props} />
                    : <code className="block bg-gray-800 text-gray-200 p-3 rounded-md my-3 overflow-x-auto text-sm" {...props} />,
                em: ({node, ...props}) => <em className="text-gray-200 italic" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />
              }}
            >
              {data.explanation}
            </Markdown>
          )}
        </div>
        
        {data.details && data.details.length > 0 && (
          <div className="mt-4 border-t border-gray-700 pt-4">
            <p className="font-medium text-gray-200 mb-3">Key Details:</p>
            <ul className="space-y-2">
              {data.details.map((detail: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span className="text-gray-300 text-sm">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    let messageContent;
    
    try {
      if (!isUser) {
        const parsedContent = JSON.parse(message.content);
        messageContent = formatMessageContent(parsedContent);
      } else {
        messageContent = <p className="text-sm">{message.content}</p>;
      }
    } catch (e) {
      // Fallback for unparseable content
      messageContent = <p className="text-sm text-gray-300">{message.content}</p>;
    }
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <div className={`py-6 ${!isUser ? "bg-gray-800/30" : ""} px-4 md:px-6 w-full`}>
          <div className="max-w-3xl mx-auto flex">
            {/* Avatar */}
            <div className="mr-4 flex-shrink-0 mt-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isUser ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-white/10'
              }`}>
                {isUser ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
            
            {/* Message content */}
            <div className="flex-1">
              <div className="text-sm text-gray-200">
                {messageContent}
              </div>
              
              {/* Message footer */}
              <div className="mt-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-400">
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                
                {/* Message actions */}
                {!isUser && (
                  <div className="flex items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              try {
                                const parsedContent = JSON.parse(message.content);
                                copyToClipboard(parsedContent.explanation || message.content, message.id);
                              } catch (e) {
                                copyToClipboard(message.content, message.id);
                              }
                            }}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copiedId === message.id ? "Copied!" : "Copy"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-400 border-b border-white/10">
                          Actions
                        </div>
                        
                        <div className="p-2 border-b border-white/10">
                          <div className="flex items-center mb-2">
                            <Globe className="mr-2 h-4 w-4 text-blue-400" />
                            <span className="text-sm">Translate</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {languages.slice(0, 6).map(lang => (
                              <Button 
                                key={lang.code}
                                size="sm"
                                variant={lang.code === selectedLanguage ? "default" : "outline"}
                                disabled={isTranslating || lang.code === selectedLanguage}
                                className="text-xs h-7"
                                onClick={() => translateMessage(message.id, lang.code)}
                              >
                                {lang.code.toUpperCase()}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <DropdownMenuItem onClick={() => copyToClipboard(message.content, message.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy text
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (status === "unauthenticated") {
    window.location.href = "/auth/signin";
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Left Sidebar - Chat History */}
      <div 
        className={`flex flex-col border-r border-white/10 bg-gray-900/95 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } transition-all duration-200 ease-in-out z-20`}
      >
        {/* Sidebar Header */}
        <div className="p-3 flex items-center justify-between border-b border-white/10">
          {!sidebarCollapsed && (
            <h2 className="text-sm font-semibold">Chat History</h2>
          )}
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* New Chat Button */}
        <Button 
          variant="outline" 
          onClick={createNewChat}
          className={`m-3 justify-start bg-white/5 hover:bg-white/10 border-0 ${
            sidebarCollapsed ? 'px-2' : ''
          }`}
        >
          <Plus className="h-4 w-4 mr-2" />
          {!sidebarCollapsed && "New Chat"}
        </Button>
        
        {/* Chat List */}
        <div className="flex-1 overflow-auto">
          {chatSessions.map(chat => (
            <a 
              key={chat.id}
              href={`/chat?id=${chat.id}`}
              className={`flex items-center p-3 text-sm ${
                chat.id === chatId ? 'bg-blue-900/30 text-white' : 'hover:bg-white/5'
              } transition-colors`}
            >
              {sidebarCollapsed ? (
                <MessageSquare className="h-4 w-4" />
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="flex-1 truncate">
                    <span className="font-medium">{chat.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-400" />
                  </Button>
                </>
              )}
            </a>
          ))}
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10">
          {sidebarCollapsed ? (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  {session?.user?.name?.[0] || 'U'}
                </div>
                <span className="text-sm">{session?.user?.name || 'User'}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/10 px-4 py-3 glass flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Insurance Assistant</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[180px] h-8 border-white/10 bg-white/5">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-blue-400" />
                    <SelectValue placeholder="Language" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center">
                        <span className="mr-2">{lang.code === selectedLanguage ? '✓' : ''}</span>
                        {lang.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {parsedPDFs.length > 0 && (
              <Badge variant="outline" className="border-white/20">
                {parsedPDFs.length} document{parsedPDFs.length > 1 ? 's' : ''} loaded
              </Badge>
            )}
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <AnimatePresence>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mb-6">
                  <Bot className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2 text-center">
                  How can I help you today?
                </h2>
                <p className="text-gray-300 text-center max-w-md mb-8">
                  Upload your insurance documents and ask questions about your coverage, claims, and benefits.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  <div className="p-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <h3 className="font-medium text-white mb-1">Upload a policy</h3>
                    <p className="text-sm text-gray-300">
                      Add your insurance documents to get started
                    </p>
                  </div>
                  <div className="p-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <h3 className="font-medium text-white mb-1">Ask a question</h3>
                    <p className="text-sm text-gray-300">
                      "Is my knee surgery covered in Pune?"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pb-32">
                {messages.map(renderMessage)}
              </div>
            )}
          </AnimatePresence>
          
          {isLoading && (
            <div className="py-6 px-4 md:px-6">
              <div className="max-w-3xl mx-auto flex">
                <div className="mr-4 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-400">Analyzing your query...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed bottom-32 right-6"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={scrollToBottom}
                      size="sm"
                      className="rounded-full shadow-lg bg-white/10 hover:bg-white/20 h-9 w-9 p-0"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Scroll to bottom</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Upload Area */}
        {files.length > 0 && (
          <div className="px-6 py-2 bg-blue-900/20 border-t border-white/10">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-full text-sm">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="truncate max-w-32 text-gray-300">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-4 w-4 p-0 hover:bg-red-900/30 text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area - Add voice button here */}
        <div className="border-t border-white/10 px-6 py-4 glass absolute bottom-0 left-0 right-0">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-end space-x-3">
            <div className="flex-1 relative">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your insurance coverage, claims, or benefits..."
                className="min-h-[60px] max-h-32 resize-none bg-white/5 border-white/10 focus:border-blue-400 rounded-lg"
                disabled={isLoading || isListening}
              />
              {detectedLanguage && detectedLanguage !== "en" && (
                <Badge className="absolute top-2 right-2 border-blue-500/30 text-blue-400 bg-blue-500/10">
                  <Globe className="w-3 h-3 mr-1" />
                  {detectedLanguage.toUpperCase()}
                </Badge>
              )}
              {isListening && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="ml-2 text-sm text-gray-400">Listening...</span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isListening}
                      className="h-10 w-10 rounded-lg border-white/20 bg-white/5 hover:bg-white/10"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload PDF</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={isListening ? "destructive" : "outline"}
                      size="icon"
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      className={`h-10 w-10 rounded-lg ${
                        isListening 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "border-white/20 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isListening ? "Stop listening" : "Voice input"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                type="submit"
                disabled={isLoading || isListening || !query.trim()}
                className="h-10 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span className="mr-2">Send</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
