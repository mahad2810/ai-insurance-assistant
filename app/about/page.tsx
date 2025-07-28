"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Bot, Upload, MessageSquare, Users, Award } from "lucide-react";

export default function About() {
  const features = [
    {
      icon: <Bot className="h-8 w-8 text-blue-400" />,
      title: "AI-Powered Analysis",
      description: "Advanced AI technology that understands complex insurance documents and provides instant, accurate answers to your questions."
    },
    {
      icon: <Upload className="h-8 w-8 text-purple-400" />,
      title: "Secure Document Upload",
      description: "Upload your insurance documents securely with enterprise-grade encryption and privacy protection."
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-green-400" />,
      title: "Interactive Chat",
      description: "Have natural conversations about your insurance coverage with our intelligent assistant."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-400" />,
      title: "Privacy First",
      description: "Your documents and conversations are encrypted and never shared with third parties."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Documents Analyzed" },
    { number: "5,000+", label: "Happy Users" },
    { number: "99.9%", label: "Accuracy Rate" },
    { number: "24/7", label: "Availability" }
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            About Insurance Assistant
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We're revolutionizing how people understand and interact with their insurance documents. 
            Our AI-powered platform makes complex insurance language simple and accessible.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-lg leading-relaxed">
                Insurance documents are often complex and difficult to understand. Our mission is to bridge 
                this gap by providing an intelligent assistant that can analyze your insurance documents and 
                answer your questions in plain English. We believe everyone deserves to understand their 
                coverage without needing a law degree.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
              >
                <Card className="glass h-full">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Trusted by Thousands
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Technology Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Powered by Advanced AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                Our platform leverages cutting-edge artificial intelligence and natural language processing 
                to understand complex insurance documents. We use state-of-the-art machine learning models 
                trained specifically on insurance terminology and legal language.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Every interaction helps our AI become smarter and more accurate, ensuring you get the most 
                reliable answers to your insurance questions.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
