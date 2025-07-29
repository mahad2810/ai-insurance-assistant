import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth";
import { hybridSearch, type SearchResult } from "@/lib/hybrid-search";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import { ChatSession, Message } from "@/lib/models";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { updateUserStats } from "@/lib/auth";
import { getApiKey } from "@/lib/env";

// Create a temporary directory for secure file storage
const TEMP_DIR = path.join(os.tmpdir(), "insurance-docs");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Parse structured information from the query
function parseQueryStructure(query: string) {
  console.log("🔍 Parsing structured information from query");
  
  // Age parsing - look for patterns like "46-year-old", "46 years", "46yr", etc.
  const ageMatch = query.match(/\b(\d+)(?:\s*-?\s*(?:year|yr)s?(?:\s*-?\s*old)?|\s*M|\s*F)\b/i);
  const age = ageMatch ? parseInt(ageMatch[1]) : null;
  
  // Gender parsing - look for explicit mentions or abbreviations
  const genderMatches = [
    { pattern: /\b(?:male|man|boy|gentleman|he|him|M)\b/i, value: "male" },
    { pattern: /\b(?:female|woman|girl|lady|she|her|F)\b/i, value: "female" }
  ];
  let gender = null;
  for (const match of genderMatches) {
    if (match.pattern.test(query)) {
      gender = match.value;
      break;
    }
  }
  
  // Procedure parsing - enhanced to catch more variations
  // First look for common medical procedures with specific patterns
  const commonProcedures = [
    "knee surgery", "hip replacement", "appendectomy", "cataract surgery", 
    "bypass surgery", "angioplasty", "cesarean", "hysterectomy", "gallbladder removal",
    "hernia repair", "tonsillectomy", "kidney stone removal", "dental surgery",
    "chemotherapy", "radiation therapy", "dialysis", "physical therapy",
    "cardiac surgery", "brain surgery", "spine surgery", "cosmetic surgery"
  ];
  
  let procedure = null;
  
  // First check for exact matches of common procedures
  for (const proc of commonProcedures) {
    if (query.toLowerCase().includes(proc)) {
      procedure = proc;
      break;
    }
  }
  
  // If no common procedure found, try pattern matching
  if (!procedure) {
    const procedureMatches = [
      // Pattern: "surgery for X" or "X surgery"
      /\b(?:surgery|operation|procedure|treatment)\s+(?:for|on|of)?\s+([a-z\s]+)\b/i,
      /\b([a-z\s]+)\s+(?:surgery|operation|procedure|treatment)\b/i,
      // Pattern: "X implant" or "X replacement"
      /\b([a-z\s]+)\s+(?:implant|replacement|transplant)\b/i,
      // Pattern: "removal of X"
      /\bremoval\s+of\s+([a-z\s]+)\b/i,
      // Pattern: "X scan" or "X test"
      /\b([a-z\s]+)\s+(?:scan|test|screening|x-ray|mri|ct scan)\b/i,
      // Pattern: "treating X" or "treating for X"
      /\btreating\s+(?:for\s+)?([a-z\s]+)\b/i
    ];
    
    for (const pattern of procedureMatches) {
      const match = query.match(pattern);
      if (match && match[1]) {
        procedure = match[1].trim();
        // Remove common words that might be captured but aren't part of the procedure
        procedure = procedure.replace(/\b(?:the|a|an|this|that|these|those)\b/gi, "").trim();
        break;
      }
    }
  }
  
  // If still no procedure found, look for medical terms
  if (!procedure) {
    const medicalTerms = [
      "surgery", "treatment", "procedure", "operation", "therapy", 
      "transplant", "implant", "scan", "test", "screening", "consultation"
    ];
    
    for (const term of medicalTerms) {
      if (query.toLowerCase().includes(term)) {
        procedure = term;
        break;
      }
    }
  }
  
  // Location parsing - look for Indian cities and general location patterns
  const indianCities = ["mumbai", "delhi", "pune", "bangalore", "hyderabad", "chennai", "kolkata", 
                      "ahmedabad", "jaipur", "surat", "lucknow", "kanpur", "nagpur", "indore", 
                      "thane", "bhopal", "visakhapatnam", "patna", "vadodara", "ghaziabad"];
  
  let location = null;
  
  // Check for exact city matches
  for (const city of indianCities) {
    if (query.toLowerCase().includes(city)) {
      location = city.charAt(0).toUpperCase() + city.slice(1); // Capitalize city name
      break;
    }
  }
  
  // If no city found, try pattern matching
  if (!location) {
    const locationMatch = query.match(/\b(?:in|at|from)\s+([A-Za-z\s]+(?:city|town|village|hospital|clinic|center))\b/i);
    location = locationMatch ? locationMatch[1].trim() : null;
  }
  
  // Policy duration parsing - enhanced to catch more variations
  const durationMatches = [
    // Standard patterns
    { pattern: /\b(\d+)\s*(?:month|mo)s?\s*(?:old)?\s*policy\b/i, unit: "months" },
    { pattern: /\b(\d+)\s*(?:year|yr)s?\s*(?:old)?\s*policy\b/i, unit: "years" },
    { pattern: /\bpolicy\s*(?:is|that is|which is)?\s*(\d+)\s*(?:month|mo)s?\s*old\b/i, unit: "months" },
    { pattern: /\bpolicy\s*(?:is|that is|which is)?\s*(\d+)\s*(?:year|yr)s?\s*old\b/i, unit: "years" },
    // Abbreviated patterns
    { pattern: /\b(\d+)m\s*policy\b/i, unit: "months" },
    { pattern: /\b(\d+)y\s*policy\b/i, unit: "years" },
    { pattern: /\b(\d+)-month\b/i, unit: "months" },
    { pattern: /\b(\d+)-year\b/i, unit: "years" },
    // Hyphenated patterns
    { pattern: /\b(\d+)-month-old\s*policy\b/i, unit: "months" },
    { pattern: /\b(\d+)-year-old\s*policy\b/i, unit: "years" }
  ];
  
  let duration = null;
  for (const match of durationMatches) {
    const result = query.match(match.pattern);
    if (result && result[1]) {
      duration = {
        value: parseInt(result[1]),
        unit: match.unit
      };
      break;
    }
  }
  
  const parsedData = {
    age,
    gender,
    procedure,
    location,
    duration
  };
  
  console.log("✅ Parsed query structure:", parsedData);
  
  return parsedData;
}

// 🤖 LLM API INTEGRATION POINT
// Using Google Gemini Flash 2.0 model
async function queryLLM(query: string, relevantClauses: any[], parsedQuery: any, language = "en") {
  try {
    const GEMINI_API_KEY = getApiKey('GEMINI_API_KEY');

    // Create a system prompt based on whether we have policy clauses
    const isInsuranceQuery = relevantClauses && relevantClauses.length > 0 && relevantClauses[0].text !== "No policy document provided";
    
    let systemPrompt = `You are AI Assistant, a helpful and knowledgeable AI that provides clear and comprehensive responses.

USER QUERY:
${query}

`;

    if (isInsuranceQuery) {
      systemPrompt += `POLICY INFORMATION EXTRACTED:
- Age: ${parsedQuery.age || 'Not specified'}
- Gender: ${parsedQuery.gender || 'Not specified'}
- Topic/Procedure: ${parsedQuery.procedure || 'Not specified'}
- Location: ${parsedQuery.location || 'Not specified'}
- Policy Duration: ${parsedQuery.duration ? `${parsedQuery.duration.value} ${parsedQuery.duration.unit}` : 'Not specified'}

RELEVANT POLICY CLAUSES:
${relevantClauses.map((clause, i) => `[Clause ${clause.index || i+1}] ${clause.text.substring(0, 300)}${clause.text.length > 300 ? '...' : ''}`).join('\n\n')}

REQUIRED OUTPUT FORMAT:

## Summary
🔍 Provide a clear, one-sentence verdict on whether ${parsedQuery.procedure || 'the requested item/service'} is covered.

## Analysis
📋 Explain the rationale for the coverage decision, referencing specific policy details.

## Financial Information
💰 Detail any relevant costs, limits, or payment requirements.

## Next Steps
✅ List specific actions the user should take.

GUIDELINES:
1. Start with a definitive statement about coverage
2. Use clear, simple language
3. Support decisions with policy references
4. List any required documentation
5. Mention relevant limitations or conditions`;
    } else {
      systemPrompt += `REQUIRED OUTPUT FORMAT:

## Answer
🎯 Provide a clear, direct answer to the main question.

## Explanation
📝 Offer detailed supporting information and context.

## Key Points
💡 List 3-5 important takeaways or considerations.

## Next Steps
✅ Provide practical recommendations or action items if applicable.

GUIDELINES:
1. Be clear and concise in your main answer
2. Use examples when helpful
3. Break down complex topics
4. Provide actionable insights
5. Maintain a helpful and informative tone`;
    }

    systemPrompt += `

Your response must be comprehensive, accurate, and helpful while maintaining a professional tone.`;

    // Prepare the payload for the Gemini API
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40
      }
    };

    console.log("🤖 Querying Gemini API...");
    
    // Make the API call
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error("❌ Gemini API error:", data.error);
      throw new Error(data.error.message || "LLM query failed");
    }

    // Extract the response text
    const responseText = data.candidates[0].content.parts[0].text.trim();
    
    console.log("✅ Gemini API response received");
    
    // Parse the decision from the response - more conclusive approach
    let decision = "needs_review";
    let confidence = 0.5; // Default confidence
    
    // First check for explicit statements about coverage
    if (responseText.toLowerCase().includes("is covered") || 
        responseText.toLowerCase().includes("are covered") ||
        responseText.toLowerCase().includes("does cover") ||
        responseText.toLowerCase().includes("fully covered") ||
        responseText.toLowerCase().includes("coverage applies")) {
      decision = "COVERED";
      confidence = 0.85;
    } 
    else if (responseText.toLowerCase().includes("is not covered") || 
             responseText.toLowerCase().includes("are not covered") ||
             responseText.toLowerCase().includes("does not cover") ||
             responseText.toLowerCase().includes("no coverage") ||
             responseText.toLowerCase().includes("explicitly excluded")) {
      decision = "NOT_COVERED";
      confidence = 0.85;
    }
    // More nuanced coverage indicators
    else if (responseText.toLowerCase().includes("will be covered") ||
             responseText.toLowerCase().includes("would be covered") ||
             responseText.toLowerCase().includes("should be covered")) {
      decision = "COVERED";
      confidence = 0.75;
    }
    else if (responseText.toLowerCase().includes("will not be covered") ||
             responseText.toLowerCase().includes("would not be covered") ||
             responseText.toLowerCase().includes("should not be covered") ||
             responseText.toLowerCase().includes("unlikely to be covered")) {
      decision = "NOT_COVERED";
      confidence = 0.75;
    }
    
    // Extract potential amount information
    let amount = null;
    const amountRegex = /(₹|Rs\.?|INR)\s?(\d{1,3}(,\d{3})*(\.\d{1,2})?)/gi;
    const amountMatches = responseText.match(amountRegex);
    
    if (amountMatches && amountMatches.length > 0) {
      amount = amountMatches[0];
    }
    
    // Extract key details using bullet points and lists
    const details = [];
    const lines = responseText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || 
          (line.match(/^\d+\./) && line.length < 200)) {
        details.push(line.replace(/^[•\-*]\s*|^\d+\.\s*/, ''));
      }
    }
    
    // Handle translation if needed
    let translatedResponse = responseText;
    
    if (language && language !== "en") {
      try {
        // Translate the response
        const translationResponse = await translateText(responseText, language);
        if (translationResponse) {
          translatedResponse = translationResponse;
        }
      } catch (error) {
        console.error("Translation error:", error);
      }
    }
    
    return {
      decision,
      confidence,
      explanation: translatedResponse,
      amount,
      details: details.length > 0 ? details.slice(0, 5) : undefined,
    };
  } catch (error) {
    console.error("❌ LLM query error:", error);
    throw error;
  }
}

// Function to translate text using the translation API
async function translateText(text: string, targetLanguage: string): Promise<string | null> {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetLang: targetLanguage
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.translatedText;
    }
    return null;
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
}

import { detectLanguage } from "../detect-language/route";

// Function to securely store an uploaded document
async function secureStoreDocument(pdfContent: string, userId: string): Promise<string> {
  // Generate a unique filename
  const filename = `${userId}_${Date.now()}_${crypto.randomBytes(8).toString("hex")}.txt`;
  const filepath = path.join(TEMP_DIR, filename);
  
  // Store file with content
  fs.writeFileSync(filepath, pdfContent);
  
  console.log(`📁 Document securely stored at: ${filepath}`);
  return filepath;
}

// Function to retrieve a document
async function retrieveDocument(filePath: string, requestUserId: string): Promise<string | null> {
  try {
    // Security check - ensure filename contains the userId
    const filename = path.basename(filePath);
    if (!filename.startsWith(requestUserId + "_")) {
      console.error("❌ Security: User tried to access file not owned by them");
      return null;
    }
    
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    }
    return null;
  } catch (error) {
    console.error("❌ Error retrieving document:", error);
    return null;
  }
}

// Function to save the chat message and LLM response
async function saveChatMessages(chatId: string, userMessage: string, aiResponse: any) {
  try {
    await dbConnect();
    
    // Check if this is the first message in the chat
    const existingMessages = await Message.find({ chatId }).countDocuments();
    
    if (existingMessages === 0) {
      // This is the first message, generate a title from the user's query
      let chatTitle = userMessage;
      if (chatTitle.length > 50) {
        chatTitle = chatTitle.substring(0, 47) + '...';
      }
      
      // Update the chat title
      await ChatSession.updateOne(
        { chatId },
        { 
          title: chatTitle,
          updatedAt: new Date()
        }
      );
    }
    
    // Generate message IDs
    const userMessageId = uuidv4();
    const aiMessageId = uuidv4();
    
    // Save user message
    await Message.create({
      messageId: userMessageId,
      chatId,
      sender: "user",
      content: userMessage,
      timestamp: new Date()
    });
    
    // Save AI response
    await Message.create({
      messageId: aiMessageId,
      chatId,
      sender: "assistant",
      content: JSON.stringify(aiResponse),
      timestamp: new Date()
    });
    
    // Update chat session timestamp
    await ChatSession.updateOne({ chatId }, { updatedAt: new Date() });
    
    return {
      userMessageId,
      aiMessageId
    };
  } catch (error) {
    console.error("❌ Error saving chat messages:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const body = await request.json();
    const { query, pdfContent, chunks = [], chatId, language } = body;

    console.log("🚀 Ask API called:", {
      hasQuery: !!query,
      queryLength: query?.length,
      hasPdfContent: !!pdfContent,
      pdfContentLength: pdfContent?.length,
      hasChunks: !!chunks,
      chunksCount: chunks?.length,
      originalLanguage: language,
      hasUserId: !!userId,
      hasChatId: !!chatId,
      timestamp: new Date().toISOString(),
    });

    if (!query) {
      console.error("❌ No query provided");
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }
    
    // If authenticated, securely store the PDF document
    let documentPath = null;
    if (userId && pdfContent) {
      documentPath = await secureStoreDocument(pdfContent, userId);
    }
    
    // Detect language if not provided
    let queryLanguage = language;
    if (!queryLanguage && query.trim().length > 0) {
      console.log("🔍 No language specified, detecting language...");
      queryLanguage = await detectLanguage(query);
      console.log(`🌐 Detected language: ${queryLanguage}`);
    }
    
    // Parse structured information from query
    const parsedQuery = parseQueryStructure(query);
    
    // Run query processing and relevant chunk finding
    console.log("🧠 Processing query and finding relevant chunks in parallel...");
    
    // Find relevant chunks using hybrid search
    let relevantChunks;
    if (chunks && chunks.length > 0) {
      console.log("🔍 Finding relevant chunks using text-based search...");
      
      try {
        // Use our enhanced search approach (keyword + BM25)
        const searchResults = hybridSearch(
          query, 
          chunks.map((chunk: string | {text: string}) => typeof chunk === 'string' ? chunk : chunk.text),
          Math.max(5, Math.ceil(chunks.length * 0.25)) // Get top 25% chunks or at least 5
        );
        
        // Convert search results to the expected format
        relevantChunks = searchResults.map(result => ({
          index: result.index,
          text: result.text,
          similarity: result.similarity
        }));
      } catch (error) {
        console.error("❌ Text search failed:", error);
        console.log("⚠️ Falling back to basic chunk selection");
        
        // Fallback to returning all chunks with neutral similarity
        relevantChunks = chunks.map((text: string | {text: string}, index: number) => ({
          index,
          text: typeof text === 'string' ? text : text.text,
          similarity: 1.0 - (index * 0.01) // Slightly decrease similarity for each chunk
        }));
      }
    } else {
      console.log("⚠️ No valid chunks provided, using full document");
      // If no chunks provided, use the full document
      relevantChunks = [{
        index: 0,
        similarity: 1.0,
        text: pdfContent || "No policy document provided"
      }];
    }
    
    // Take top 3 chunks for LLM processing
    if (relevantChunks.length > 3) {
      // Sort by similarity (highest first) if not already sorted
      relevantChunks.sort((a: {similarity: number}, b: {similarity: number}) => b.similarity - a.similarity);
      relevantChunks = relevantChunks.slice(0, 3);
    }
    
    console.log("✅ Found relevant chunks:", {
      count: relevantChunks.length,
      topSimilarity: relevantChunks[0]?.similarity,
    });

    // Process with LLM
    console.log("🔄 Processing query with LLM...");
    const result = await queryLLM(query, relevantChunks, parsedQuery, queryLanguage);

    console.log("✅ LLM processing complete:", {
      decision: result.decision,
      confidence: result.confidence,
      hasAmount: !!result.amount,
      detailsCount: result.details?.length || 0,
    });

    // If user is authenticated and chatId is provided, save messages to the database
    if (userId && chatId) {
      try {
        const messageIds = await saveChatMessages(chatId, query, result);
        console.log("💾 Chat messages saved:", messageIds);
      } catch (error) {
        console.error("❌ Error saving chat messages:", error);
        // Continue with the response even if saving messages fails
      }
    }

    // Check if we need to translate the response back to the original language
    let translatedResult: {
      decision: string;
      amount: any;
      confidence: number;
      explanation: string;
      details?: string[];
      timestamp?: string;
      parsedQuery?: any;
      wasTranslated?: boolean;
      originalQuery?: string;
      documentPath?: string;
    } = { 
      ...result,
      timestamp: new Date().toISOString(),
      parsedQuery
    };
    
    if (queryLanguage && queryLanguage !== "en") {
      console.log(`🌐 Translating response to detected language: ${queryLanguage}`);
      try {
        // Translate the justification
        const GEMINI_API_KEY = getApiKey('GEMINI_API_KEY');
        
        const justificationPrompt = `Translate the following text from English to ${queryLanguage}. Preserve all formatting, including emojis, bullet points, and section headers:
        
        ${result.explanation}`;
        
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
        
        // Translate details (batch translate)
        const detailsPrompt = `Translate each line from English to ${queryLanguage}. Return only the translated lines separated by ||| (triple pipe):
        
        ${result.details?.join('\n') || ''}`;
        
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
        
        // Update the result with translated content
        translatedResult = {
          ...result,
          explanation: translatedJustification,
          details: translatedDetails,
          wasTranslated: true,
          originalQuery: query, // Store the original query for reference
          documentPath // Store the document path
        };
        
        console.log("✅ Response successfully translated to", queryLanguage);
      } catch (error) {
        console.error("❌ Translation error:", error);
        console.log("⚠️ Returning response in English due to translation error");
      }
    } else {
      // Store document path in the result
      translatedResult.documentPath = documentPath;
    }

    const response = {
      success: true,
      ...translatedResult,
      originalLanguage: queryLanguage || "en",
      detectedLanguage: queryLanguage !== language ? queryLanguage : undefined,
      parsedQuery,
      originalQuery: query,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Sending response to client:", {
      success: response.success,
      decision: response.decision,
      wasTranslated: !!translatedResult.wasTranslated,
      timestamp: response.timestamp,
    });

    if (userId) {
      try {
        await updateUserStats(userId, 'totalQueries');
        if (chatId) {
          await updateUserStats(userId, 'totalChats');
        }
        await updateUserStats(userId, 'documentsAnalyzed');
      } catch (error) {
        console.error("Error updating user stats:", error);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 Ask API error:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });

    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}

