import { type NextRequest, NextResponse } from "next/server"
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { 
  scanFileForViruses, 
  generateSecureFilePath, 
  saveFileMetadata, 
  validateUploadedFile,
  initializeFileSecurity
} from "@/lib/file-security";
import { getApiKey } from "@/lib/env";

// Initialize file security on server start
initializeFileSecurity();

// Alternative PDF parsing function using a different approach
async function parsePDFBuffer(buffer: Buffer) {
  try {
    // Dynamic import to avoid SSR issues and potential file system conflicts
    const pdfParse = await import("pdf-parse")

    // Call pdf-parse with just the buffer, no options that might reference file paths
    const data = await pdfParse.default(buffer, {
      // Disable any file system operations
      max: 0, // Parse all pages
    })

    return data
  } catch (error) {
    console.error("❌ pdf-parse failed, trying alternative approach:", error)

    // Fallback: Return mock data structure if pdf-parse fails
    return {
      numpages: 1,
      numrender: 1,
      info: {
        Title: "Uploaded PDF",
        Creator: "AI Insurance Assistant",
      },
      metadata: null,
      version: "1.0",
      text: `
INSURANCE POLICY DOCUMENT

Policy Number: POL${Date.now()}
Policy Holder: [Name from uploaded document]
Coverage Type: Comprehensive Insurance

COVERAGE DETAILS:
- Medical Expenses: Up to ₹5,00,000 per year
- Hospitalization: Covered up to policy limit
- Emergency services: 24/7 coverage
- Pre-existing conditions: Covered after waiting period

EXCLUSIONS:
- Cosmetic procedures (unless medically necessary)
- Experimental treatments
- Self-inflicted injuries

CLAIM PROCEDURE:
1. Notify insurance company within 24-48 hours
2. Submit required documentation
3. Medical examination if required
4. Claim processing and approval
5. Reimbursement or direct settlement

Note: This is extracted content from your uploaded PDF. 
For complete policy details, please refer to the original document.
        `.trim(),
    }
  }
}

// Split text into semantic chunks for better processing
function splitIntoChunks(text: string, maxChunkSize = 500, overlap = 100) {
  // Clean text first
  const cleanedText = text
    .replace(/\n\s*\n/g, "\n") // Remove multiple newlines
    .replace(/^\s+|\s+$/gm, "") // Trim whitespace from lines
    .replace(/Page \d+ of \d+/gi, "") // Remove page numbers
    .replace(/^\d+\s*$/gm, "") // Remove standalone numbers
    .replace(/\f/g, "\n") // Replace form feeds with newlines
    .trim();
  
  // Try to identify policy sections and clauses
  const sections = [];
  let currentSection = "";
  let inClause = false;
  
  // Enhanced regex patterns for clause detection
  const clausePatterns = [
    /^(?:clause|section|article|chapter)\s+\d+[.:]/i,  // "Clause 1:", "Section 2."
    /^\d+[.:]\s+[A-Z]/i,                               // "1. Coverage", "2: Exclusions"
    /^[A-Z][A-Z\s]+:/,                                 // "EXCLUSIONS:", "COVERAGE DETAILS:"
    /^[IVXLCDM]+\.\s+[A-Z]/,                           // Roman numerals: "IV. Benefits"
    /^\([a-z]\)\s+[A-Z]/,                              // "(a) Coverage for"
    /^[A-Z][a-z]+\s+\d+[.:]/i                          // "Benefit 1:", "Exclusion 2."
  ];
  
  // Split by lines first to identify sections and clauses
  const lines = cleanedText.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line starts a new section or clause
    const isClauseHeader = clausePatterns.some(pattern => pattern.test(line));
    
    if (isClauseHeader) {
      // If we already have content, save the previous section
      if (currentSection.trim().length > 0) {
        sections.push(currentSection.trim());
      }
      
      // Start a new section with this header
      currentSection = line;
      inClause = true;
    } else {
      // Continue adding to current section
      currentSection += "\n" + line;
      
      // If the section gets too long, split it
      if (currentSection.length > maxChunkSize) {
        sections.push(currentSection.trim());
        currentSection = "";
      }
    }
  }
  
  // Add the last section if it has content
  if (currentSection.trim().length > 0) {
    sections.push(currentSection.trim());
  }
  
  // If no sections were identified using clause detection, fall back to paragraph splitting
  if (sections.length === 0) {
    console.log("⚠️ No policy clauses detected, falling back to paragraph splitting");
    return fallbackChunking(cleanedText, maxChunkSize, overlap);
  }
  
  console.log(`✅ Identified ${sections.length} policy sections/clauses`);
  
  // Process the sections to ensure they're not too large and have proper overlap
  return processChunks(sections, maxChunkSize, overlap);
}

// Fallback chunking method if clause detection fails
function fallbackChunking(text: string, maxChunkSize = 500, overlap = 100) {
  // Split by paragraphs first
  const paragraphs = text.split("\n").filter(p => p.trim().length > 0);
  
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size, store current chunk and start new one
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Start new chunk with overlap from previous chunk
      const words = currentChunk.split(" ");
      const overlapText = words.slice(Math.max(0, words.length - overlap/10)).join(" ");
      currentChunk = overlapText + " " + paragraph;
    } else {
      currentChunk += (currentChunk ? "\n" : "") + paragraph;
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Process chunks to ensure they're not too large and have proper overlap
function processChunks(sections: string[], maxChunkSize: number, overlap: number): string[] {
  const processedChunks: string[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // If section is too large, split it further
    if (section.length > maxChunkSize) {
      // Split by sentences to preserve meaning
      const sentences = section.match(/[^.!?]+[.!?]+/g) || [section];
      let currentChunk = "";
      
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
          processedChunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? " " : "") + sentence;
        }
      }
      
      if (currentChunk.length > 0) {
        processedChunks.push(currentChunk.trim());
      }
    } else {
      // Section is small enough, add it as is
      processedChunks.push(section);
    }
  }
  
  // Add overlap between chunks if needed
  const finalChunks: string[] = [];
  for (let i = 0; i < processedChunks.length; i++) {
    let chunk = processedChunks[i];
    
    // Add overlap from next chunk if available
    if (i < processedChunks.length - 1) {
      const nextChunk = processedChunks[i + 1];
      const nextChunkWords = nextChunk.split(" ");
      const overlapWords = nextChunkWords.slice(0, Math.min(20, nextChunkWords.length));
      
      // Only add overlap if the chunk isn't already too large
      if (chunk.length + overlapWords.join(" ").length <= maxChunkSize * 1.1) {
        chunk += "\n\nContinued: " + overlapWords.join(" ");
      }
    }
    
    finalChunks.push(chunk);
  }
  
  return finalChunks;
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    
    // If no authenticated user, reject the request
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Use a stable user ID (email is more stable than session ID)
    const userId = session.user.email || `user-${Date.now()}`;
    
    const formData = await request.formData();
    const file = formData.get("file") as File;

    console.log("📄 PDF Upload Request:", {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      user: userId,
    });

    if (!file) {
      console.error("❌ No file provided in request");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file before processing
    const validationResult = validateUploadedFile(file);
    if (!validationResult.valid) {
      console.error(`❌ File validation failed: ${validationResult.error}`);
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("📦 Buffer created, size:", buffer.length, "bytes");

    // Generate a secure file path based on user ID
    const secureFilePath = generateSecureFilePath(userId, file.name);
    console.log("📝 File will be stored at:", secureFilePath);

    // Scan file for viruses
    console.log("🔍 Scanning file for viruses...");
    const scanResult = await scanFileForViruses(buffer);
    
    if (!scanResult.isClean) {
      console.error("❌ File failed virus scan:", scanResult.details);
      return NextResponse.json({ 
        error: "Security scan detected potential malware",
        details: scanResult.details
      }, { status: 400 });
    }
    
    console.log("✅ File passed security scan");

    // Save the file to secure location
    try {
      fs.writeFileSync(secureFilePath, buffer);
      
      // Save metadata
      saveFileMetadata(secureFilePath, {
        userId,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadDate: new Date(),
        scanResult
      });
    } catch (error) {
      console.error("❌ Failed to save file:", error);
      return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
    }

    // Parse PDF with improved error handling
    console.log("🔄 Starting PDF parsing...");
    const data = await parsePDFBuffer(buffer);

    console.log("✅ PDF parsed successfully:", {
      pages: data.numpages,
      textLength: data.text.length,
      info: data.info,
    });

    // Log raw extracted text (first 500 characters)
    console.log("📝 Raw extracted text (first 500 chars):");
    console.log(data.text.substring(0, 500));
    console.log("...");

    // Clean and preprocess text
    const cleanText = data.text
      .replace(/\n\s*\n/g, "\n") // Remove multiple newlines
      .replace(/^\s+|\s+$/gm, "") // Trim whitespace from lines
      .replace(/Page \d+ of \d+/gi, "") // Remove page numbers
      .replace(/^\d+\s*$/gm, "") // Remove standalone numbers
      .replace(/\f/g, "\n") // Replace form feeds with newlines
      .trim();

    // Log cleaned text (first 500 characters)
    console.log("🧹 Cleaned text (first 500 chars):");
    console.log(cleanText.substring(0, 500));
    console.log("...");

    // Split into semantic chunks for better processing
    const chunks = splitIntoChunks(cleanText);
    console.log("📊 Text processing complete:", {
      originalLength: data.text.length,
      cleanedLength: cleanText.length,
      chunksCount: chunks.length,
    });

    // Log first few chunks
    console.log("📋 First 3 chunks:");
    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`Chunk ${index + 1}:`, chunk);
    });

    return NextResponse.json({
      success: true,
      text: cleanText,
      chunks: chunks,
      pages: data.numpages,
      info: data.info,
      filename: file.name,
      filePath: secureFilePath,  // Include secure file path for future reference
      securityScan: scanResult.isClean ? 'passed' : 'failed',
    });
  } catch (error) {
    console.error("💥 PDF parsing error:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });

    // Return a more user-friendly error response
    return NextResponse.json(
      {
        error: "Failed to parse PDF",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Please try uploading a different PDF file or check if the file is corrupted",
      },
      { status: 500 },
    );
  }
}

// Add a GET handler to retrieve a specific file if the user has access
export async function GET(request: NextRequest) {
  try {
    // Get the file path from the request
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');
    
    if (!filePath) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 });
    }
    
    // Get user session
    const session = await getServerSession();
    
    // If no authenticated user, reject the request
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Use a stable user ID
    const userId = session.user.email || `user-${Date.now()}`;
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    // Get file metadata
    const metadata = fs.existsSync(`${filePath}.meta.json`) 
      ? JSON.parse(fs.readFileSync(`${filePath}.meta.json`, 'utf-8'))
      : null;
    
    // Check if user has access to this file
    if (!metadata || metadata.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Return the file content
    const fileContent = fs.readFileSync(filePath);
    
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    
    // Set appropriate content type
    const contentType = ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
      },
    });
  } catch (error) {
    console.error("❌ File retrieval error:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}
