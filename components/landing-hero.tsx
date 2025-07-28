"use client"

import React from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MessageSquare, Upload, Bot, ShieldCheck, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </Card>
);

export default function LandingHero() {
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
          AI Insurance Assistant
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Unlock insights from your insurance documents instantly. Get clear answers about your coverage, claims, and benefits with AI-powered assistance.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isAuthenticated ? (
            <>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => window.location.href = '/dashboard'}
              >
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white bg-white/5 hover:bg-white/10"
                onClick={() => window.location.href = '/chat'}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Start Chatting
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Sign Up
                </Button>
              </Link>
            </>
          )}
          
          <Link href="https://github.com/yourusername/ai-insurance-assistant" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="border-white/20 text-white bg-white/5 hover:bg-white/10">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <FeatureCard
            icon={<Bot className="h-6 w-6 text-white" />}
            title="AI-Powered Analysis"
            description="Get instant answers about your insurance coverage with advanced AI that understands policy language."
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <FeatureCard
            icon={<Upload className="h-6 w-6 text-white" />}
            title="Secure Document Upload"
            description="Upload your insurance documents securely. We use encryption and secure storage for your sensitive information."
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6 text-white" />}
            title="Persistent Chat History"
            description="Access your previous conversations and documents anytime. Your data is securely stored and always available."
          />
        </motion.div>
      </div>
    </div>
  );
} 