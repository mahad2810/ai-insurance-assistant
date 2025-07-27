"use client"

import React from "react"
import type { ReactElement } from "react"
import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Mic, Send, FileText, X, Globe, MicOff, Loader2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import ResultsPanel from "./results-panel"

// Simple type for our speech recognition reference
type WebSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: ((event: Event) => void) | null;
  onnomatch: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

// Update the ParsedPDF interface to remove embeddings
interface ParsedPDF {
  text: string
  chunks: string[]
  pages: number
  filename: string
}

export default function QueryInterface(): ReactElement {
  const [query, setQuery] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [parsedPDFs, setParsedPDFs] = useState<ParsedPDF[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en")
  const [voiceLanguage, setVoiceLanguage] = useState<string>("en-US") // Default voice language
  const [results, setResults] = useState<any>(null)
  const [showPDFPreview, setShowPDFPreview] = useState<string | null>(null)
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)

  // Store the latest parsed PDF for reuse
  const [latestParsedPDF, setLatestParsedPDF] = useState<ParsedPDF | null>(null);

  const recognitionRef = useRef<WebSpeechRecognition | null>(null)
  const languageDetectionTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const { toast } = useToast()

  // Common language options for voice recognition
  const languageOptions = [
    { code: "en-US", name: "English (US)" },
    { code: "en-IN", name: "English (India)" },
    { code: "hi-IN", name: "Hindi" },
    { code: "mr-IN", name: "Marathi" },
    { code: "ta-IN", name: "Tamil" },
    { code: "te-IN", name: "Telugu" },
    { code: "gu-IN", name: "Gujarati" },
    { code: "kn-IN", name: "Kannada" },
    { code: "bn-IN", name: "Bengali" },
  ]

  // Map ISO 639-1 codes to BCP 47 language tags for speech recognition
  const mapLanguageToVoiceCode = (langCode: string): string => {
    const mapping: Record<string, string> = {
      "en": "en-US",
      "hi": "hi-IN",
      "mr": "mr-IN",
      "ta": "ta-IN",
      "te": "te-IN",
      "gu": "gu-IN",
      "kn": "kn-IN",
      "bn": "bn-IN",
      // Add more mappings as needed
    }
    return mapping[langCode] || "en-US"
  }

  // Initialize Speech Recognition
  const initSpeechRecognition = useCallback(() => {
    console.log("🎤 Initializing speech recognition...")

    if (typeof window === "undefined") {
      console.warn("⚠️ Window is undefined, cannot initialize speech recognition")
      return
    }

    // Check for speech recognition support
    const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) as unknown as {
      new (): WebSpeechRecognition;
    } | undefined;

    if (!SpeechRecognition) {
      console.warn("⚠️ Speech recognition not supported in this browser")
      toast({
        title: "Speech recognition not supported",
        description: "Please use Chrome, Edge, or Safari for voice input",
        variant: "destructive",
        open: true
      })
      return
    }

    try {
      const recognition = new SpeechRecognition()

      // Configure recognition settings
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.lang = voiceLanguage // Use the selected voice language

      console.log("🎤 Speech recognition configured:", {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang,
      })

      recognition.onstart = () => {
        console.log("🎤 Speech recognition started")
        setIsListening(true)
        toast({
          title: "Listening...",
          description: `Speak your question in ${languageOptions.find(l => l.code === voiceLanguage)?.name || voiceLanguage}`,
          open: true
        })
      }

      recognition.onresult = async (event: any) => {
        const result = event.results[0]
        const transcript = result[0].transcript
        const confidence = result[0].confidence

        console.log("🗣️ Speech recognition result:", {
          transcript,
          confidence,
          isFinal: result.isFinal,
          language: recognition.lang,
        })

        setQuery(transcript)

        // Auto-detect language from the transcript
        try {
          const detectionResponse = await fetch("/api/detect-language", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: transcript }),
          });
          
          const detectionData = await detectionResponse.json();
          
          if (detectionData.success && detectionData.detectedLanguage) {
            setDetectedLanguage(detectionData.detectedLanguage);
            console.log(`🌐 Language detected from voice: ${detectionData.detectedLanguage}`);
          }
        } catch (error) {
          console.error("Language detection error:", error);
        }
      }

      recognition.onerror = (event: any) => {
        console.error("❌ Speech recognition error:", {
          error: event.error,
          message: event.message,
        })

        let errorMessage = "Please try again or type your question"

        switch (event.error) {
          case "not-allowed":
            errorMessage = "Microphone access denied. Please allow microphone permissions."
            break
          case "no-speech":
            errorMessage = "No speech detected. Please try speaking again."
            break
          case "audio-capture":
            errorMessage = "Microphone not found. Please check your microphone."
            break
          case "network":
            errorMessage = "Network error. Please check your internet connection."
            break
          case "language-not-supported":
            errorMessage = "Language not supported. Switching to English."
            recognition.lang = "en-US"
            break
        }

        toast({
          title: "Voice input failed",
          description: errorMessage,
          variant: "destructive",
          open: true
        })
      }

      recognition.onend = () => {
        console.log("🎤 Speech recognition ended")
        setIsListening(false)
      }

      recognition.onnomatch = () => {
        console.warn("⚠️ Speech recognition: no match found")
        toast({
          title: "No speech recognized",
          description: "Please try speaking more clearly",
          variant: "destructive",
          open: true
        })
      }

      recognitionRef.current = recognition
      console.log("✅ Speech recognition initialized successfully")
    } catch (error) {
      console.error("💥 Error initializing speech recognition:", error)
      toast({
        title: "Speech recognition error",
        description: "Failed to initialize voice input",
        variant: "destructive",
        open: true
      })
    }
  }, [toast, voiceLanguage, languageOptions])

  // Update recognition when voice language changes
  React.useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = voiceLanguage;
      console.log(`🔄 Updated voice recognition language to: ${voiceLanguage}`);
    }
  }, [voiceLanguage]);

  // Update voice language when detected language changes
  React.useEffect(() => {
    const mappedVoiceCode = mapLanguageToVoiceCode(detectedLanguage);
    if (mappedVoiceCode !== voiceLanguage) {
      setVoiceLanguage(mappedVoiceCode);
      console.log(`🔄 Updated voice language based on detected language: ${mappedVoiceCode}`);
    }
  }, [detectedLanguage]);

  const startListening = () => {
    console.log("🎤 Starting voice input...")

    if (!recognitionRef.current) {
      console.log("🔄 Recognition not initialized, initializing now...")
      initSpeechRecognition()

      // Wait a bit for initialization
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start()
          } catch (error) {
            console.error("❌ Error starting recognition:", error)
            toast({
              title: "Voice input failed",
              description: "Could not start voice recognition",
              variant: "destructive",
              open: true
            })
          }
        }
      }, 100)
    } else {
      try {
        recognitionRef.current.lang = voiceLanguage; // Ensure language is updated
        recognitionRef.current.start()
      } catch (error) {
        console.error("❌ Error starting recognition:", error)

        // Recognition might already be running
        if (error instanceof Error && error.message.includes("already started")) {
          console.log("ℹ️ Recognition already running, stopping first...")
          recognitionRef.current.stop()
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.lang = voiceLanguage; // Ensure language is updated
              recognitionRef.current.start()
            }
          }, 100)
        } else {
          toast({
            title: "Voice input failed",
            description: "Could not start voice recognition",
            variant: "destructive",
            open: true
          })
        }
      }
    }
  }

  const stopListening = () => {
    console.log("🛑 Stopping voice input...")
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error("❌ Error stopping recognition:", error)
      }
    }
  }

  const translateQuery = async (text: string) => {
    console.log("🌐 Starting translation for:", text.substring(0, 50) + "...")
    setIsTranslating(true)

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: "en" }),
      })

      const data = await response.json()
      console.log("🌐 Translation API response:", data)

      if (data.success) {
        setDetectedLanguage(data.detectedLanguage)
        if (data.detectedLanguage !== "en") {
          console.log("✅ Translation successful:", {
            original: text,
            translated: data.translatedText,
            detectedLanguage: data.detectedLanguage,
          })
          setQuery(data.translatedText)
          toast({
            title: "Query translated",
            description: `Detected ${data.detectedLanguage.toUpperCase()} and translated to English`,
            open: true
          })
        } else {
          console.log("ℹ️ Text is already in English, no translation needed")
        }
      }
    } catch (error) {
      console.error("❌ Translation error:", error)
      toast({
        title: "Translation failed",
        description: "Using original text",
        variant: "destructive",
        open: true
      })
    } finally {
      setIsTranslating(false)
    }
  }

  // Update the parsePDF function to set isParsing state
  const parsePDF = async (file: File) => {
    console.log("📄 Parsing PDF:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    setIsParsing(true) // Set parsing state to true when starting
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ PDF parsing failed:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ PDF parsing successful:", {
        success: data.success,
        textLength: data.text?.length,
        chunksCount: data.chunks?.length,
        pages: data.pages,
      })

      // Log parsed content (first 200 characters)
      console.log("📝 Parsed PDF content (first 200 chars):")
      console.log(data.text?.substring(0, 200) + "...")

      if (data.success) {
        setParsedPDFs((prev) => [
          ...prev,
          {
            text: data.text,
            chunks: data.chunks,
            pages: data.pages,
            filename: file.name,
          },
        ])

        toast({
          title: "PDF parsed successfully",
          description: `Extracted text from ${data.pages} pages with ${data.chunks?.length || 0} semantic chunks`,
          open: true
        })

        // Store the parsed PDF data for future reference
        setLatestParsedPDF(data);
      } else {
        throw new Error(data.error || "Unknown parsing error")
      }
    } catch (error) {
      console.error("💥 PDF parsing error:", error)
      toast({
        title: "Error parsing PDF",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        open: true
      });

      // Remove the failed file from the list
      setFiles((prev) => prev.filter((f) => f.name !== file.name))
    } finally {
      setIsParsing(false) // Set parsing state to false when complete
    }
  }

  // Update the handleFileUpload function to handle multiple files
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || [])
    const pdfFiles = uploadedFiles.filter((file) => file.type === "application/pdf")

    console.log("📁 File upload attempt:", {
      totalFiles: uploadedFiles.length,
      pdfFiles: pdfFiles.length,
      fileNames: pdfFiles.map((f) => f.name),
    })

    if (pdfFiles.length === 0) {
      console.warn("⚠️ No valid PDF files selected")
      toast({
        title: "Invalid file type",
        description: "Please upload PDF files only",
        variant: "destructive",
        open: true
      })
      return
    }

    setFiles((prev) => [...prev, ...pdfFiles])
    setIsParsing(true) // Set parsing state to true before starting batch

    // Parse PDFs one by one
    for (const file of pdfFiles) {
      console.log("🔄 Starting PDF parsing for:", file.name)
      await parsePDF(file)
    }

    setIsParsing(false) // Ensure parsing state is false after all files are processed
  }

  const removeFile = (index: number) => {
    const removedFile = files[index]
    console.log("🗑️ Removing file:", removedFile.name)
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setParsedPDFs((prev) => prev.filter((pdf) => pdf.filename !== removedFile.name))
  }

  const handleSubmit = async () => {
    console.log("🚀 Submit button clicked:", {
      hasQuery: !!query.trim(),
      queryLength: query.trim().length,
      hasPDFs: parsedPDFs.length > 0,
      pdfCount: parsedPDFs.length,
    })

    if (!query.trim() && parsedPDFs.length === 0) {
      console.warn("⚠️ No input provided")
      toast({
        title: "Missing input",
        description: "Please enter a question or upload a PDF",
        variant: "destructive",
        open: true
      })
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      // Get the first parsed PDF (or null if none)
      const firstParsedPDF = parsedPDFs[0] || latestParsedPDF;
      
      // Make API call
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          pdfContent: firstParsedPDF?.text || "",
          originalLanguage: detectedLanguage,
          chunks: firstParsedPDF?.chunks || []
        }),
      })

      const data = await response.json()
      console.log("📥 API response received:", {
        success: data.success,
        decision: data.decision,
        confidence: data.confidence,
        parsedQuery: data.parsedQuery,
      })

      if (data.success) {
        setResults(data)
        toast({
          title: "Analysis complete",
          description: "Your query has been processed successfully",
          open: true
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("💥 Query submission error:", error)
      toast({
        title: "Query failed",
        description: "Please try again later",
        variant: "destructive",
        open: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQueryChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // If query is long enough, detect language
    if (newQuery.trim().length > 10) {
      try {
        // Debounce language detection to avoid too many API calls
        if (languageDetectionTimeout.current) {
          clearTimeout(languageDetectionTimeout.current);
        }
        
        languageDetectionTimeout.current = setTimeout(async () => {
          const response = await fetch("/api/detect-language", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newQuery.trim() }),
          });
          
          const data = await response.json();
          
          if (data.success && data.detectedLanguage) {
            setDetectedLanguage(data.detectedLanguage);
            console.log(`🌐 Language detected: ${data.detectedLanguage}`);
          }
        }, 500); // Wait 500ms after typing stops
      } catch (error) {
        console.error("Language detection error:", error);
        // Don't change the detected language on error
      }
    }
  };

  // Check speech recognition support on component mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
      console.log("🎤 Speech recognition support:", hasSupport)

      if (!hasSupport) {
        console.warn("⚠️ Speech recognition not supported in this browser")
      }
    }
  }, [])

  // Toggle language selector
  const toggleLanguageSelector = () => {
    setShowLanguageSelector(prev => !prev);
  }

  // Change voice language
  const changeVoiceLanguage = (langCode: string) => {
    setVoiceLanguage(langCode);
    setShowLanguageSelector(false);
    toast({
      title: "Voice language updated",
      description: `Voice input set to ${languageOptions.find(l => l.code === langCode)?.name || langCode}`,
      open: true
    });
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          AI Insurance Assistant
        </h1>
        <p className="text-gray-300 text-lg">Upload documents and ask questions in any language</p>
        {detectedLanguage !== "en" && (
          <Badge variant="outline" className="mt-2 border-blue-500/30 text-blue-400">
            <Globe className="w-3 h-3 mr-1" />
            Language: {detectedLanguage.toUpperCase()}
          </Badge>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {/* File Upload */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Upload className="w-5 h-5 mr-2" />
                Upload Insurance Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">Drop PDF files here or click to browse</p>
                  <p className="text-sm text-gray-500">Supports PDF documents only</p>
                </label>
              </div>

              {/* Uploaded Files */}
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-2"
                  >
                    {files.map((file, index) => {
                      const parsed = parsedPDFs.find((pdf) => pdf.filename === file.name)
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center flex-1">
                            <FileText className="w-4 h-4 text-blue-400 mr-2" />
                            <div className="flex-1">
                              <span className="text-sm text-gray-300">{file.name}</span>
                              {parsed && (
                                <p className="text-xs text-gray-500">
                                  {parsed.pages} pages • {parsed.chunks.length} sections
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {parsed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  console.log("👁️ Opening PDF preview for:", file.name)
                                  setShowPDFPreview(parsed.text)
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-gray-400 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* PDF Parsing Indicator */}
              {isParsing && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center text-amber-400">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div>
                      <p className="font-medium">Processing PDF document...</p>
                      <p className="text-xs mt-1">Please wait before submitting your query.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Query Input */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Globe className="w-5 h-5 mr-2" />
                Ask Your Question (Any Language)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Ask in Hindi, English, or any language... e.g., 'मेरी पॉलिसी में क्या कवर है?' or 'What is my deductible?'"
                  value={query}
                  onChange={handleQueryChange}
                  className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder-gray-400 resize-none pr-12"
                  disabled={isParsing}
                />
                {isTranslating && (
                  <div className="absolute top-2 right-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  </div>
                )}
              </div>

              {/* Processing notice */}
              {isParsing && (
                <div className="flex items-center text-amber-400 text-sm">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing PDF document... Please wait before submitting your query.
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || (!query.trim() && parsedPDFs.length === 0) || isParsing}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Ask AI
                    </>
                  )}
                </Button>

                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={isListening ? stopListening : toggleLanguageSelector}
                    disabled={isLoading}
                    className={`border-white/20 text-white hover:bg-white/10 bg-transparent ${
                      isListening ? "bg-red-500/20 border-red-500/30" : ""
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  
                  {/* Language Selector Dropdown */}
                  {showLanguageSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full right-0 mb-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-2 w-48 z-10"
                    >
                      <div className="text-xs text-gray-400 mb-2 px-2">Select voice language:</div>
                      {languageOptions.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => changeVoiceLanguage(lang.code)}
                          className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/10 ${
                            voiceLanguage === lang.code ? 'bg-blue-500/20 text-blue-400' : 'text-white'
                          }`}
                        >
                          {lang.name}
                          {voiceLanguage === lang.code && <span className="ml-2">✓</span>}
                        </button>
                      ))}
                      <div className="border-t border-white/10 mt-2 pt-2">
                        <button
                          onClick={startListening}
                          className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/10 text-green-400"
                        >
                          Start Listening
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {query && detectedLanguage !== "en" && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => translateQuery(query)}
                    disabled={isTranslating}
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  </Button>
                )}
              </div>

              {/* Voice Language Indicator */}
              {voiceLanguage !== "en-US" && (
                <div className="text-xs text-blue-400 flex items-center">
                  <Mic className="w-3 h-3 mr-1" />
                  Voice input: {languageOptions.find(l => l.code === voiceLanguage)?.name || voiceLanguage}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <ResultsPanel results={results} isLoading={isLoading} originalLanguage={detectedLanguage} />
        </motion.div>
      </div>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {showPDFPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              console.log("❌ Closing PDF preview")
              setShowPDFPreview(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-4xl max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">PDF Content Preview</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPDFPreview(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{showPDFPreview}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
