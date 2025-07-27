// Type definitions
export type SearchResult = {
  index: number;
  text: string;
  similarity: number;
  method: string; // Indicates which method found this result
};

/**
 * BM25 parameters
 * k1: Term frequency saturation parameter (1.2-2.0 is typical)
 * b: Document length normalization (0.75 is typical)
 */
const BM25_K1 = 1.5;
const BM25_B = 0.75;

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
}

/**
 * Calculate BM25 scores for a query against a set of documents
 */
export function calculateBM25(query: string, chunks: string[], topK = 3): SearchResult[] {
  console.log("🔍 Calculating BM25 scores for query");
  
  // Tokenize all documents
  const tokenizedChunks = chunks.map(chunk => tokenize(chunk));
  
  // Calculate document frequencies
  const docFreq: {[token: string]: number} = {};
  tokenizedChunks.forEach(tokens => {
    const uniqueTokens = [...new Set(tokens)];
    uniqueTokens.forEach(token => {
      docFreq[token] = (docFreq[token] || 0) + 1;
    });
  });
  
  // Calculate average document length
  const avgDocLength = tokenizedChunks.reduce((sum, tokens) => sum + tokens.length, 0) / 
                      Math.max(1, tokenizedChunks.length);
  
  // Tokenize query
  const queryTokens = tokenize(query);
  
  // Calculate BM25 scores
  const scores = tokenizedChunks.map((tokens, index) => {
    let score = 0;
    
    for (const qToken of queryTokens) {
      if (!docFreq[qToken]) continue;
      
      // Term frequency in document
      const tf = tokens.filter(t => t === qToken).length;
      if (tf === 0) continue;
      
      // Inverse document frequency
      const idf = Math.log((chunks.length - docFreq[qToken] + 0.5) / (docFreq[qToken] + 0.5) + 1);
      
      // BM25 score for this term
      const termScore = idf * ((tf * (BM25_K1 + 1)) / 
                      (tf + BM25_K1 * (1 - BM25_B + BM25_B * (tokens.length / avgDocLength))));
      score += termScore;
    }
    
    return { 
      index, 
      text: chunks[index], 
      similarity: score, 
      method: "bm25" 
    };
  });
  
  // Normalize scores to 0-1 range for better comparison
  const maxScore = Math.max(...scores.map(s => s.similarity), 0.001);
  scores.forEach(s => s.similarity = s.similarity / maxScore);
  
  return scores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Fast keyword matching for quick filtering
 */
export function keywordMatch(query: string, chunks: string[], topK = 10): SearchResult[] {
  console.log("🔍 Performing fast keyword matching");
  
  // Extract keywords from query (words with 3+ chars)
  const queryWords = tokenize(query).filter(word => word.length >= 3);
  
  if (queryWords.length === 0) {
    return chunks.map((text, index) => ({
      index,
      text,
      similarity: 0.5, // Neutral score
      method: "keyword"
    }));
  }
  
  // Score each chunk based on keyword matches
  const scores = chunks.map((chunk, index) => {
    const chunkLower = chunk.toLowerCase();
    let matchCount = 0;
    let totalMatches = 0;
    
    // Count keyword occurrences
    for (const word of queryWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = chunkLower.match(regex);
      if (matches) {
        matchCount++;
        totalMatches += matches.length;
      }
    }
    
    // Calculate score based on percentage of query words matched and their frequency
    const coverage = matchCount / queryWords.length;
    const frequency = totalMatches / Math.max(1, chunk.split(/\s+/).length);
    const score = (coverage * 0.7) + (frequency * 0.3);
    
    return { 
      index, 
      text: chunk, 
      similarity: score,
      method: "keyword"
    };
  });
  
  return scores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Enhanced search that combines keyword matching and BM25 for optimal results
 */
export function enhancedSearch(
  query: string,
  chunks: string[],
  topK = 3
): SearchResult[] {
  console.log("🔍 Performing enhanced search (keyword + BM25)");
  
  try {
    // Input validation
    if (!query || !chunks || chunks.length === 0) {
      console.warn("⚠️ Invalid inputs to enhancedSearch, returning empty array");
      return [];
    }
    
    // Start with fast keyword filtering to reduce the search space
    const keywordResults = keywordMatch(query, chunks, Math.max(topK * 3, 10));
    
    // If we have very few chunks or keyword results are poor, use all chunks
    const filteredChunks = keywordResults.length >= topK ? 
      keywordResults.map(r => chunks[r.index]) : 
      chunks;
    
    const filteredIndices = keywordResults.length >= topK ?
      keywordResults.map(r => r.index) :
      chunks.map((_, i) => i);
    
    // Calculate BM25 scores for filtered chunks
    const bm25Results = calculateBM25(query, filteredChunks, topK);
    
    // Map BM25 results back to original indices
    bm25Results.forEach(result => {
      result.index = filteredIndices[result.index];
      result.text = chunks[result.index];
    });
    
    // Combine results with weights
    const combinedScores: {[index: number]: SearchResult} = {};
    
    // Add keyword results with lower weight
    keywordResults.slice(0, topK).forEach(result => {
      combinedScores[result.index] = {
        ...result,
        similarity: result.similarity * 0.3, // 30% weight to keyword matching
        method: "combined_keyword"
      };
    });
    
    // Add BM25 results with higher weight
    bm25Results.forEach(result => {
      if (combinedScores[result.index]) {
        // If already in combined results, add weighted BM25 score
        combinedScores[result.index].similarity += result.similarity * 0.7; // 70% weight to BM25
        combinedScores[result.index].method = "combined_full";
      } else {
        // Otherwise add with full BM25 weight
        combinedScores[result.index] = {
          ...result,
          method: "combined_bm25"
        };
      }
    });
    
    // Convert back to array and sort
    const finalResults = Object.values(combinedScores)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
    
    console.log(`✅ Enhanced search complete, found ${finalResults.length} results`);
    
    return finalResults;
  } catch (error) {
    console.error("❌ Enhanced search failed:", error);
    
    // Fallback to simple keyword matching
    console.log("⚠️ Falling back to simple keyword matching");
    return keywordMatch(query, chunks, topK);
  }
}

// For backward compatibility, keep the hybridSearch function name
export const hybridSearch = enhancedSearch; 