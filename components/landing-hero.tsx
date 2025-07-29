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
  <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 sm:p-6 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
      {icon}
    </div>
    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">{title}</h3>
    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{description}</p>
  </Card>
);

export default function LandingHero() {
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-6 sm:mb-12"
      >
        <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-3 sm:mb-6 leading-tight">
          AI Insurance Assistant
        </h1>
        <p className="text-sm xs:text-base sm:text-xl text-gray-300 max-w-3xl mx-auto mb-5 sm:mb-8 px-1 xs:px-2">
          Unlock insights from your insurance documents instantly. Get clear answers about your coverage, claims, and benefits with AI-powered assistance.
        </p>
        <div className="flex flex-col items-center justify-center gap-2 xs:gap-3 sm:gap-4 w-full max-w-md mx-auto sm:max-w-none sm:flex-row">
          {isAuthenticated ? (
            <>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = '/dashboard'}
              >
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/20 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = '/chat'}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Start Chatting
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-white/20 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 xs:gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 lg:gap-8 mt-6 sm:mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <FeatureCard
            icon={<Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
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
            icon={<Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
            title="Secure Document Upload"
            description="Upload your insurance documents securely. We use encryption and secure storage for your sensitive information."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="sm:col-span-2 lg:col-span-1"
        >
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
            title="Persistent Chat History"
            description="Access your previous conversations and documents anytime. Your data is securely stored and always available."
          />
        </motion.div>
      </div>
    </div>
  );
} 