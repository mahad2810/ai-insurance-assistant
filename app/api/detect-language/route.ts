import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/env";

// Detect language using Gemini API
export async function detectLanguage(text: string) {
  try {
    const GEMINI_API_KEY = getApiKey('GEMINI_API_KEY');
    
    const prompt = `Detect the language of the following text. Return only the ISO 639-1 language code (e.g., 'en' for English, 'hi' for Hindi, 'mr' for Marathi, etc.). Do not include any explanation or additional text.

Text: "${text.substring(0, 500)}"`; // Limit to 500 chars for detection
    
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10
      }
    };
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ Gemini API language detection error:", data.error);
      throw new Error(data.error.message || "Language detection failed");
    }
    
    const detectedLanguage = data.candidates[0].content.parts[0].text.trim().toLowerCase();
    
    // Validate that we got a proper language code
    if (/^[a-z]{2}(-[a-z]{2})?$/.test(detectedLanguage)) {
      console.log(`✅ Language detected: ${detectedLanguage}`);
      return detectedLanguage;
    } else {
      console.warn(`⚠️ Invalid language code detected: ${detectedLanguage}, falling back to 'en'`);
      return "en";
    }
  } catch (error) {
    console.error("❌ Language detection error:", error);
    return "en"; // Default to English on error
  }
}

// POST endpoint for language detection
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No valid text provided" }, { status: 400 });
    }

    const detectedLanguage = await detectLanguage(text);

    return NextResponse.json({
      success: true,
      detectedLanguage,
      text: text.substring(0, 100) + (text.length > 100 ? "..." : "") // Return truncated text for verification
    });
  } catch (error) {
    console.error("❌ Language detection error:", error);
    return NextResponse.json({ error: "Language detection failed" }, { status: 500 });
  }
}

// GET endpoint for language detection with query parameter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const detectedLanguage = await detectLanguage(text);

    return NextResponse.json({
      success: true,
      detectedLanguage,
      text: text.substring(0, 100) + (text.length > 100 ? "..." : "") // Return truncated text for verification
    });
  } catch (error) {
    console.error("❌ Language detection error:", error);
    return NextResponse.json({ error: "Language detection failed" }, { status: 500 });
  }
} 