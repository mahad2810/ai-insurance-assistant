import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

const SYSTEM_PROMPT = `You are an AI assistant specializing in insurance-related queries. 
Provide helpful, accurate information about insurance coverage, claims, and benefits.
Keep responses concise and clear.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Prepare the messages array with the system prompt
    const conversationMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-5) // Keep only the last 5 messages to stay within context limits
    ];

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from AI model");
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return NextResponse.json({
      success: true,
      message: aiMessage,
    });
  } catch (error) {
    console.error("Error in try-chat:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
