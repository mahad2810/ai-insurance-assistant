import { NextRequest, NextResponse } from 'next/server';
import { TranslationServiceClient } from '@google-cloud/translate';
import { GoogleAuth } from 'google-auth-library';
import { getApiKey, getGoogleCredentials } from "@/lib/env";

// Language detection helper using Gemini API
async function detectLanguageWithGemini(text: string) {
  try {
    const GEMINI_API_KEY = getApiKey('GEMINI_API_KEY');
    
    const prompt = `Detect the language of the following text. Return only the ISO 639-1 language code (e.g., 'en' for English, 'hi' for Hindi, 'mr' for Marathi, etc.). Do not include any explanation or additional text.

Text: "${text.substring(0, 500)}${text.length > 500 ? '...' : ''}"`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
        })
      }
    );
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    const langCode = data.candidates[0].content.parts[0].text.trim().toLowerCase();
    return langCode;
  } catch (error) {
    console.error("Language detection failed:", error);
    return "en"; // Default to English on failure
  }
}

// Primary translation function using Google Cloud Translation API
async function translateWithGoogleCloudAPI(text: string, targetLang = "en") {
  try {
    // Get Google Cloud credentials (handles base64 decoding)
    const { credentials, projectId } = getGoogleCredentials();
    
    if (!credentials || !projectId) {
      // Fall back to Gemini if credentials are not available
      console.log("No valid Google Cloud credentials found, falling back to Gemini API");
      return translateWithGeminiAPI(text, targetLang);
    }

    // Initialize the client with credentials and project
    let client;
    
    // Handle different credential formats
    if (typeof credentials === 'string') {
      // Path to credentials file
      client = new TranslationServiceClient({
        projectId,
        keyFilename: credentials
      });
    } else {
      // Direct credentials object
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        projectId,
        credentials
      }) as any;  // Use type assertion to avoid typing issues
      
      client = new TranslationServiceClient({
        projectId,
        auth
      });
    }
    
    // Detect the source language first for better results
    let sourceLang = await detectLanguageWithGemini(text);
    
    // Handle the case where source and target languages are the same
    if (sourceLang === targetLang) return text;
    
    console.log(`Translating from ${sourceLang} to ${targetLang} using Google Cloud Translation API`);
    
    // Format the request
    const request = {
      parent: `projects/${projectId}/locations/global`,
      contents: [text],
      mimeType: 'text/plain',
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    };
    
    // Make the API call
    const [response] = await client.translateText(request);
    
    if (!response.translations || response.translations.length === 0) {
      throw new Error("No translations returned");
    }
    
    return response.translations[0].translatedText;
  } catch (error) {
    console.error("Google Cloud Translation API error:", error);
    // Fall back to Gemini API
    return translateWithGeminiAPI(text, targetLang);
  }
}

// Fallback translation function using Gemini API
async function translateWithGeminiAPI(text: string, targetLang = "en") {
  try {
    const GEMINI_API_KEY = getApiKey('GEMINI_API_KEY');
    
    // First, detect the language using our heuristic detector
    let sourceLang = await detectLanguageWithGemini(text);
    
    // No need to translate if source and target languages are the same
    if (sourceLang === targetLang) {
      return text;
    }
    
    // Map language codes to full names for better Gemini understanding
    const languageMap: {[key: string]: string} = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'hi': 'Hindi',
      'mr': 'Marathi',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'bn': 'Bengali',
      'ur': 'Urdu',
      'it': 'Italian'
    };
    
    const sourceLangName = languageMap[sourceLang] || sourceLang;
    const targetLangName = languageMap[targetLang] || targetLang;
    
    // Create a prompt for translation
    const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. 
Preserve all formatting, including paragraph breaks, bullet points, and markdown formatting.

Text to translate:
"${text}"

Translated text:`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            topP: 0.8,
            topK: 40
          }
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini API error:", data.error);
      throw new Error(data.error.message || "Translation failed");
    }
    
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const { text, targetLang = 'en' } = await request.json();
    
    if (!text) {
      return NextResponse.json({ success: false, error: "No text provided" }, { status: 400 });
    }
    
    // Try Google Cloud Translation API first (will fall back to Gemini if needed)
    const translatedText = await translateWithGoogleCloudAPI(text, targetLang);
    
    return NextResponse.json({
      success: true,
      translatedText,
      originalText: text,
      targetLanguage: targetLang
    });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown translation error" },
      { status: 500 }
    );
  }
}
