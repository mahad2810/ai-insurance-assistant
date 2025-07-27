import { createHash } from 'crypto';

// Simple in-memory cache for embeddings
type EmbeddingCache = {
  [contentHash: string]: {
    embeddings: number[];
    timestamp: number;
  };
};

// Global cache object
const embeddingCache: EmbeddingCache = {};

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Global vocabulary for consistent embedding dimensions
let globalVocabulary: string[] = [];
let isGlobalVocabularyInitialized = false;

/**
 * Generate a content hash for caching
 */
export function generateContentHash(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Check if embeddings are cached for a given content
 */
export function getCachedEmbedding(content: string): number[] | null {
  const contentHash = generateContentHash(content);
  const cached = embeddingCache[contentHash];
  
  if (!cached) return null;
  
  // Check if cache has expired
  if (Date.now() - cached.timestamp > CACHE_EXPIRATION) {
    delete embeddingCache[contentHash];
    return null;
  }
  
  console.log("✅ Using cached embedding for content hash:", contentHash.substring(0, 8));
  return cached.embeddings;
}

/**
 * Store embeddings in cache
 */
export function cacheEmbedding(content: string, embeddings: number[]): void {
  const contentHash = generateContentHash(content);
  embeddingCache[contentHash] = {
    embeddings,
    timestamp: Date.now()
  };
  console.log("💾 Cached embedding for content hash:", contentHash.substring(0, 8));
}

/**
 * Initialize the global vocabulary from a set of texts
 * This ensures consistent embedding dimensions across different calls
 */
export function initializeGlobalVocabulary(texts: string[]): void {
  console.log("🔄 Initializing global vocabulary from", texts.length, "texts");
  
  const vocabulary = new Set<string>();
  
  texts.forEach(text => {
    // Simple tokenization: lowercase, remove punctuation, split by whitespace
    const tokens = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1); // Filter out single characters
    
    tokens.forEach(token => vocabulary.add(token));
  });
  
  globalVocabulary = Array.from(vocabulary);
  isGlobalVocabularyInitialized = true;
  
  console.log(`✅ Global vocabulary initialized with ${globalVocabulary.length} terms`);
}

/**
 * Generate lightweight embeddings for pre-filtering
 * This is a simple TF-IDF style approach that works on CPUs
 */
export function generateLightweightEmbeddings(texts: string[], useGlobalVocab = true): number[][] {
  console.log("🔍 Generating lightweight embeddings for", texts.length, "chunks");
  
  // Tokenize all texts
  const tokenizedTexts = texts.map(text => {
    // Simple tokenization: lowercase, remove punctuation, split by whitespace
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1); // Filter out single characters
  });
  
  // Determine which vocabulary to use
  let vocabArray: string[];
  
  if (useGlobalVocab && isGlobalVocabularyInitialized) {
    // Use the global vocabulary
    vocabArray = globalVocabulary;
    console.log(`Using global vocabulary with ${vocabArray.length} terms`);
  } else {
    // Create vocabulary from the current texts
    const vocabulary = new Set<string>();
    tokenizedTexts.forEach(tokens => {
      tokens.forEach(token => vocabulary.add(token));
    });
    vocabArray = Array.from(vocabulary);
    
    // If this is a large set of texts and global vocab isn't initialized,
    // initialize it now for future use
    if (texts.length > 5 && !isGlobalVocabularyInitialized) {
      globalVocabulary = vocabArray;
      isGlobalVocabularyInitialized = true;
      console.log(`✅ Global vocabulary initialized with ${globalVocabulary.length} terms`);
    }
  }
  
  // Calculate document frequency for each term
  const docFrequency: {[term: string]: number} = {};
  for (const term of vocabArray) {
    docFrequency[term] = tokenizedTexts.filter(tokens => tokens.includes(term)).length;
  }
  
  // Generate TF-IDF vectors
  return tokenizedTexts.map(tokens => {
    const vector = new Array(vocabArray.length).fill(0);
    
    // Count term frequencies
    const termFrequency: {[term: string]: number} = {};
    for (const token of tokens) {
      termFrequency[token] = (termFrequency[token] || 0) + 1;
    }
    
    // Calculate TF-IDF for each term
    vocabArray.forEach((term, index) => {
      if (termFrequency[term]) {
        // TF = term frequency / document length
        const tf = termFrequency[term] / tokens.length;
        // IDF = log(total documents / document frequency)
        const idf = Math.log(texts.length / (docFrequency[term] || 1));
        // TF-IDF = TF * IDF
        vector[index] = tf * idf;
      }
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / magnitude;
      }
    }
    
    return vector;
  });
}

/**
 * Generate a single lightweight embedding vector for a query
 * using the global vocabulary to ensure dimension compatibility
 */
export function generateQueryEmbedding(query: string): number[] {
  // If global vocabulary isn't initialized, we can't generate a compatible embedding
  if (!isGlobalVocabularyInitialized) {
    console.warn("⚠️ Global vocabulary not initialized, generating fallback embedding");
    // Generate a simple fallback embedding with a fixed dimension
    // We'll use a fixed seed to ensure consistency
    const fallbackDimension = 275; // Match the typical vocabulary size
    return Array.from({ length: fallbackDimension }, (_, i) => {
      // Use a deterministic approach based on the query and position
      const charCodes = query.split('').map(c => c.charCodeAt(0));
      const charSum = charCodes.reduce((sum, code) => sum + code, 0);
      const seed = (charSum * (i + 1)) % 997; // Use a prime number for better distribution
      return (Math.sin(seed) * 2) - 1; // Range between -1 and 1
    });
  }
  
  console.log("🔍 Generating query embedding using global vocabulary");
  
  // Tokenize the query
  const tokens = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1);
  
  // Create the vector using global vocabulary
  const vector = new Array(globalVocabulary.length).fill(0);
  
  // Count term frequencies
  const termFrequency: {[term: string]: number} = {};
  for (const token of tokens) {
    termFrequency[token] = (termFrequency[token] || 0) + 1;
  }
  
  // Calculate TF-IDF for each term in global vocabulary
  globalVocabulary.forEach((term, index) => {
    if (termFrequency[term]) {
      // TF = term frequency / document length
      const tf = termFrequency[term] / tokens.length;
      // Simple IDF (since we only have one document)
      const idf = 1;
      vector[index] = tf * idf;
    }
  });
  
  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] = vector[i] / magnitude;
    }
  }
  
  return vector;
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a fallback value of 0.5 if vectors have different lengths
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Safety checks for null/undefined vectors
  if (!vecA || !vecB) {
    console.error("❌ Null or undefined vectors passed to cosineSimilarity");
    return 0.5; // Neutral similarity
  }
  
  if (vecA.length !== vecB.length) {
    console.error(`❌ Vector length mismatch: ${vecA.length} vs ${vecB.length}`);
    // Instead of throwing an error, return a neutral similarity score
    return 0.5;
  }
  
  try {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    // Avoid division by zero
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  } catch (error) {
    console.error("❌ Error calculating cosine similarity:", error);
    return 0.5; // Neutral similarity on error
  }
}

/**
 * Find most relevant chunks using vector similarity
 */
export function findRelevantChunks(
  queryEmbedding: number[], 
  chunkEmbeddings: number[][], 
  chunks: string[], 
  topK = 3
): Array<{index: number, similarity: number, text: string}> {
  // Ensure we have valid inputs
  if (!queryEmbedding || !chunkEmbeddings || !chunks || 
      chunkEmbeddings.length === 0 || chunks.length === 0) {
    console.warn("⚠️ Invalid inputs to findRelevantChunks, returning empty array");
    return [];
  }
  
  // Check if dimensions match
  const queryDimension = queryEmbedding.length;
  
  // Calculate similarity scores with dimension checking
  const similarities = chunkEmbeddings.map((embedding, index) => {
    let similarity = 0;
    
    try {
      // Check if dimensions match
      if (embedding.length !== queryDimension) {
        console.warn(`⚠️ Vector dimension mismatch at index ${index}: query=${queryDimension}, chunk=${embedding.length}`);
        // Use a fallback similarity based on position (earlier chunks get higher scores)
        similarity = 0.5 - (index * 0.01);
      } else {
        // Calculate actual similarity
        similarity = cosineSimilarity(queryEmbedding, embedding);
      }
    } catch (error) {
      console.error(`❌ Error calculating similarity for chunk ${index}:`, error);
      // Fallback similarity
      similarity = 0.5 - (index * 0.01);
    }
    
    return {
      index,
      similarity,
      text: chunks[index]
    };
  });
  
  // Sort by similarity (highest first)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // Return top K results
  return similarities.slice(0, topK);
}

/**
 * Pre-filter chunks using lightweight embeddings before sending to Gemini
 */
export function preFilterChunks(
  query: string, 
  chunks: string[], 
  preFilterTopK = 10
): {filteredChunks: string[], filteredIndices: number[]} {
  try {
    // Input validation
    if (!query || !chunks || chunks.length === 0) {
      console.warn("⚠️ Invalid inputs to preFilterChunks, returning all chunks");
      return { 
        filteredChunks: chunks, 
        filteredIndices: chunks.map((_, i) => i) 
      };
    }
    
    // First ensure we have a global vocabulary
    if (!isGlobalVocabularyInitialized && chunks.length > 0) {
      initializeGlobalVocabulary(chunks);
    }
    
    // Generate lightweight embeddings for all chunks
    const allEmbeddings = generateLightweightEmbeddings(chunks);
    
    // Generate lightweight embedding for query using the same vocabulary
    const queryEmbedding = generateQueryEmbedding(query);
    
    // Find most relevant chunks using lightweight embeddings
    const relevantChunks = findRelevantChunks(queryEmbedding, allEmbeddings, chunks, preFilterTopK);
    
    // Extract filtered chunks and their original indices
    const filteredChunks = relevantChunks.map(item => item.text);
    const filteredIndices = relevantChunks.map(item => item.index);
    
    console.log(`✅ Pre-filtered ${chunks.length} chunks down to ${filteredChunks.length} chunks`);
    
    return { filteredChunks, filteredIndices };
  } catch (error) {
    console.error("❌ Error in preFilterChunks:", error);
    console.log("⚠️ Falling back to returning all chunks");
    
    // Return all chunks as fallback
    return { 
      filteredChunks: chunks, 
      filteredIndices: chunks.map((_, i) => i) 
    };
  }
} 