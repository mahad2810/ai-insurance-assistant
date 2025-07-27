"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Globe, Copy, ExternalLink, User, Calendar, MapPin, Stethoscope } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from 'react-markdown'
import { getApiKey } from "@/lib/env";

interface ResultsPanelProps {
  results: any
  isLoading: boolean
  originalLanguage?: string
}

export default function ResultsPanel({ results, isLoading, originalLanguage }: ResultsPanelProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedResults, setTranslatedResults] = useState<any>(null)
  const { toast } = useToast()

  // Check if results were already translated by the server
  const wasTranslatedByServer = results?.wasTranslated === true;

  const translateResults = async () => {
    // If already translated by server, just toggle between translated and English
    if (wasTranslatedByServer) {
      // We need to fetch the English version since we only have the translated version
      setIsTranslating(true);
      try {
        // Make API call to get the English version
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: results.originalQuery || "Unknown query",
            pdfContent: results.pdfContent,
            originalLanguage: "en", // Force English
            chunks: results.chunks,
            embeddings: results.embeddings
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setTranslatedResults(data);
          toast({
            title: "Showing English version",
            description: "Switched to original English response",
            open: true
          });
        } else {
          throw new Error("Failed to get English version");
        }
      } catch (error) {
        console.error("Error getting English version:", error);
        toast({
          title: "Error",
          description: "Could not retrieve English version",
          variant: "destructive",
          open: true
        });
      } finally {
        setIsTranslating(false);
      }
      return;
    }

    // Original translation logic for client-side translation
    if (!results || !originalLanguage || originalLanguage === "en") return

    setIsTranslating(true)
    try {
      const GEMINI_API_KEY = getApiKey('GEMINI_API_KEY');
      
      // Translate the justification
      const justificationPrompt = `Translate the following text from English to ${originalLanguage}. Preserve all formatting, including emojis, bullet points, and section headers:
      
      ${results.justification}`;
      
      const justificationPayload = {
        contents: [
          {
            role: "user",
            parts: [{ text: justificationPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      };
      
      const justificationResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(justificationPayload)
        }
      );
      
      const justificationData = await justificationResponse.json();
      
      if (justificationData.error) {
        throw new Error(justificationData.error.message || "Translation failed");
      }
      
      const translatedJustification = justificationData.candidates[0].content.parts[0].text.trim();
      
      // Translate the clause reference
      const clausePrompt = `Translate the following text from English to ${originalLanguage}. Only return the translated text:
      
      ${results.clauseReference}`;
      
      const clausePayload = {
        contents: [
          {
            role: "user",
            parts: [{ text: clausePrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200
        }
      };
      
      const clauseResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clausePayload)
        }
      );
      
      const clauseData = await clauseResponse.json();
      
      if (clauseData.error) {
        throw new Error(clauseData.error.message || "Translation failed");
      }
      
      const translatedClause = clauseData.candidates[0].content.parts[0].text.trim();
      
      // Translate details (batch translate)
      const detailsPrompt = `Translate each line from English to ${originalLanguage}. Return only the translated lines separated by ||| (triple pipe):
      
      ${results.details.join('\n')}`;
      
      const detailsPayload = {
        contents: [
          {
            role: "user",
            parts: [{ text: detailsPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024
        }
      };
      
      const detailsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(detailsPayload)
        }
      );
      
      const detailsData = await detailsResponse.json();
      
      if (detailsData.error) {
        throw new Error(detailsData.error.message || "Translation failed");
      }
      
      const translatedDetailsText = detailsData.candidates[0].content.parts[0].text.trim();
      const translatedDetails = translatedDetailsText.split('|||').map((item: string) => item.trim());
      
      setTranslatedResults({
        ...results,
        justification: translatedJustification,
        clauseReference: translatedClause,
        details: translatedDetails,
      });
      
      toast({
        title: "Results translated",
        description: `Translated to ${originalLanguage.toUpperCase()} using Gemini`,
        open: true
      })
    } catch (error) {
      console.error("Translation error:", error);
      
      // Fallback to API endpoint if direct Gemini call fails
      try {
        console.log("⚠️ Direct Gemini translation failed, falling back to API endpoint");
        
        // Use the server-side translation endpoint as fallback
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: results.justification, 
            targetLanguage: originalLanguage 
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Create a simplified translated version
          setTranslatedResults({
            ...results,
            justification: data.translatedText,
            clauseReference: `${results.clauseReference} (${originalLanguage})`,
          });
          
          toast({
            title: "Results partially translated",
            description: `Used fallback translation for ${originalLanguage.toUpperCase()}`,
            open: true
          });
        } else {
          throw new Error("Fallback translation failed");
        }
      } catch (fallbackError) {
        console.error("Fallback translation error:", fallbackError);
        toast({
          title: "Translation failed",
          description: "Please try again",
          variant: "destructive",
          open: true
        });
      }
    } finally {
      setIsTranslating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Result copied successfully",
      open: true
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 h-full">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mr-2" />
            AI is analyzing...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: `${60 + Math.random() * 40}%` }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                className="h-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded animate-pulse"
              />
            ))}
          </div>
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-12 h-12 border-2 border-blue-400/30 border-t-blue-400 rounded-full"
            />
          </div>
          <p className="text-center text-gray-400 text-sm">Processing your query with advanced AI...</p>
        </CardContent>
      </Card>
    )
  }

  if (!results) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 h-full">
        <CardHeader>
          <CardTitle className="text-white">AI Analysis Results</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Upload documents and ask a question to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Determine which results to show
  const currentResults = translatedResults || results;
  
  // Determine if we're showing translated content
  const isShowingTranslated = wasTranslatedByServer ? !translatedResults : !!translatedResults;

  const getDecisionIcon = (decision: string) => {
    switch (decision.toLowerCase()) {
      case "approved":
        return <CheckCircle className="w-6 h-6 text-green-400" />
      case "rejected":
        return <XCircle className="w-6 h-6 text-red-400" />
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-400" />
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision.toLowerCase()) {
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }
  }

  // Format the justification text with proper styling for sections
  const formatJustification = (text: string) => {
    if (!text) return '';
    
    // Clean up the text first - remove extra newlines and spaces
    let cleanText = text.trim()
      .replace(/\\n/g, '\n') // Replace escaped newlines with actual newlines
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/^\s+/gm, ''); // Remove leading spaces from each line
    
    // Handle asterisks for bold/italic formatting
    cleanText = cleanText
      .replace(/\*\*([^*]+)\*\*/g, '<span class="font-bold text-white">$1</span>') // Bold text
      .replace(/\*([^*]+)\*/g, '<span class="italic text-white">$1</span>'); // Italic text
    
    // Format section headers with colors
    const sections = cleanText.split(/\n(?=✅|⏳|🛑|🚑|💰)/g);
    
    return sections.map(section => {
      // Format bullet points within the section
      let formattedSection = section.replace(/\n\s*[\•\*]\s+/g, '\n<span class="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 align-middle"></span> ');
      
      // Format bold text with double asterisks or markdown-style **text**
      formattedSection = formattedSection.replace(/\*\*([^*]+)\*\*/g, '<span class="font-bold text-white">$1</span>');
      
      // Identify section type and apply appropriate styling
      if (formattedSection.startsWith('✅ Is')) {
        return `<div class="mb-6">
          <h2 class="text-lg font-bold text-green-400 mb-3">${formattedSection.split('\n')[0]}</h2>
          <div class="text-gray-300 space-y-2">${formattedSection.split('\n').slice(1).join('<br>')}</div>
        </div>`;
      }
      else if (formattedSection.startsWith('💰 Maximum Reimbursement')) {
        return `<div class="mb-6">
          <h2 class="text-lg font-bold text-yellow-400 mb-3">${formattedSection.split('\n')[0]}</h2>
          <div class="text-gray-300 space-y-2">${formattedSection.split('\n').slice(1).join('<br>')}</div>
        </div>`;
      }
      else if (formattedSection.startsWith('⏳ Policy Duration')) {
        return `<div class="mb-6">
          <h2 class="text-lg font-bold text-blue-400 mb-3">${formattedSection.split('\n')[0]}</h2>
          <div class="text-gray-300 space-y-2">${formattedSection.split('\n').slice(1).join('<br>')}</div>
        </div>`;
      }
      else if (formattedSection.startsWith('🛑 Important')) {
        return `<div class="mb-6">
          <h2 class="text-lg font-bold text-red-400 mb-3">${formattedSection.split('\n')[0]}</h2>
          <div class="text-gray-300 space-y-2">${formattedSection.split('\n').slice(1).join('<br>')}</div>
        </div>`;
      }
      else if (formattedSection.startsWith('🚑 Additional Coverage')) {
        return `<div class="mb-6">
          <h2 class="text-lg font-bold text-purple-400 mb-3">${formattedSection.split('\n')[0]}</h2>
          <div class="text-gray-300 space-y-2">${formattedSection.split('\n').slice(1).join('<br>')}</div>
        </div>`;
      }
      else if (formattedSection.startsWith('✅ Final Recommendation') || formattedSection.startsWith('✅ Recommendation')) {
        return `<div class="mb-6">
          <h2 class="text-lg font-bold text-green-400 mb-3">${formattedSection.split('\n')[0]}</h2>
          <div class="text-gray-300 space-y-2">${formattedSection.split('\n').slice(1).join('<br>')}</div>
        </div>`;
      }
      else {
        return `<div class="text-gray-300 mb-4">${formattedSection}</div>`;
      }
    }).join('');
  };

  const formattedJustification = formatJustification(currentResults.justification);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              AI Analysis Results
            </CardTitle>
            <div className="flex items-center space-x-2">
              {originalLanguage && originalLanguage !== "en" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isShowingTranslated ? () => setTranslatedResults(wasTranslatedByServer ? results : null) : translateResults}
                  disabled={isTranslating}
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  {isTranslating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Globe className="w-4 h-4 mr-2" />
                  )}
                  {isShowingTranslated ? "Show English" : "Translate"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentResults.justification)}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Decision Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {getDecisionIcon(currentResults.decision)}
              <span className="text-lg font-medium text-white capitalize">{currentResults.decision}</span>
            </div>
            <Badge className={getDecisionColor(currentResults.decision)}>{currentResults.confidence}% Confidence</Badge>
          </div>

          {/* Formatted Analysis */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="prose prose-invert max-w-none">
              <div 
                className="text-gray-300"
                dangerouslySetInnerHTML={{ 
                  __html: formattedJustification 
                }} 
              />
            </div>
          </div>

          {/* Hide all other information as requested */}
          {/* Clause Reference section removed */}
          
          {/* Parsed Query Information section removed */}

          {/* Translation Note */}
          {isShowingTranslated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-xs text-center text-blue-400 pt-2 mt-4"
            >
              <Globe className="w-3 h-3 inline mr-1" />
              Translated to {originalLanguage?.toUpperCase()} using Gemini
              {wasTranslatedByServer ? " (server-side)" : ""}
            </motion.div>
          )}

          {/* Timestamp section removed */}
        </CardContent>
      </Card>
    </motion.div>
  )
}
