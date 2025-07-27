import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import { getServerSession } from 'next-auth';
import { getApiKey } from './env';

// Configuration constants (from environment variables)
// In Vercel, we'll use /tmp for temporary file storage (the only writable directory in serverless functions)
const TEMP_STORAGE_DIR = process.env.NODE_ENV === 'production' ? '/tmp/storage' : (process.env.TEMP_FILE_STORAGE_PATH || './temp_storage');
const FILE_CLEANUP_INTERVAL_HOURS = Number(process.env.FILE_CLEANUP_INTERVAL_HOURS || '24');
const MAX_FILE_AGE_HOURS = Number(process.env.MAX_FILE_AGE_HOURS || '48');
const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB || '10');
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'application/pdf').split(',');

// Ensure the temp storage directory exists
function ensureTempDir() {
  try {
    if (!fs.existsSync(TEMP_STORAGE_DIR)) {
      fs.mkdirSync(TEMP_STORAGE_DIR, { recursive: true });
      console.log(`Created temporary storage directory: ${TEMP_STORAGE_DIR}`);
    }
  } catch (error) {
    console.error('Failed to create temporary storage directory:', error);
  }
}

// Only try to create the directory if not running in a Vercel serverless function
// or if we're in development mode
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === undefined) {
  ensureTempDir();
}

// File metadata interface
interface FileMetadata {
  originalName: string;
  uploadTime: number;
  userId: string;
  size: number;
  mimeType: string;
  scanResult?: {
    isClean: boolean;
    scanId?: string;
    message?: string;
  };
}

/**
 * Generates a secure path for storing an uploaded file
 */
export function generateSecureFilePath(userId: string, originalName: string): string {
  // Ensure the directory exists (important for serverless environments where /tmp might be cleaned)
  ensureTempDir();
  
  const userDir = path.join(TEMP_STORAGE_DIR, userId);
  
  // Create user directory if it doesn't exist
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  // Generate a secure random filename with the original extension
  const extension = path.extname(originalName);
  const secureFilename = `${uuidv4()}${extension}`;
  
  return path.join(userDir, secureFilename);
}

/**
 * Saves metadata for a file
 */
export function saveFileMetadata(filePath: string, metadata: FileMetadata): void {
  const metadataPath = `${filePath}.meta.json`;
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * Gets metadata for a file
 */
export function getFileMetadata(filePath: string): FileMetadata | null {
  const metadataPath = `${filePath}.meta.json`;
  
  try {
    if (fs.existsSync(metadataPath)) {
      const metadataContent = fs.readFileSync(metadataPath, 'utf8');
      return JSON.parse(metadataContent) as FileMetadata;
    }
  } catch (error) {
    console.error(`Error reading metadata for ${filePath}:`, error);
  }
  
  return null;
}

/**
 * Checks if a user has access to a file
 */
export function hasFileAccess(filePath: string, userId: string): boolean {
  const metadata = getFileMetadata(filePath);
  
  if (!metadata) {
    return false;
  }
  
  return metadata.userId === userId;
}

/**
 * Scans a file buffer for viruses using VirusTotal API
 */
export async function scanFileForViruses(buffer: Buffer): Promise<{ isClean: boolean; scanId?: string; message?: string }> {
  try {
    // Get the VirusTotal API key from the env module
    const apiKey = getApiKey('VIRUS_TOTAL_API_KEY');
    
    if (!apiKey) {
      console.warn('VirusTotal API key not provided. Skipping virus scan.');
      return { isClean: true, message: 'Scan skipped - no API key configured' };
    }
    
    // Calculate file hash
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // First check if this file has already been scanned on VirusTotal
    const reportResult = await getVirusTotalFileReport(fileHash, apiKey);
    
    if (reportResult.found) {
      const isClean = reportResult.malicious === 0;
      return {
        isClean,
        scanId: reportResult.scanId,
        message: isClean ? 'File is clean' : `File detected as malicious by ${reportResult.malicious} engines`
      };
    }
    
    // For actual implementation, you would upload the file to VirusTotal
    // This is a simplified mock implementation
    console.log(`[MOCK] Scanning file with hash ${fileHash} using VirusTotal API`);
    
    // Simulate a clean file for now
    return {
      isClean: true,
      scanId: `mock-scan-${Date.now()}`,
      message: 'File appears to be clean (mock scan)'
    };
  } catch (error) {
    console.error('Error during virus scan:', error);
    return { isClean: false, message: 'Error during scan, rejecting file as precaution' };
  }
}

/**
 * Gets a file report from VirusTotal API
 */
async function getVirusTotalFileReport(
  fileHash: string, 
  apiKey: string
): Promise<{ found: boolean; scanId?: string; malicious?: number }> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.virustotal.com',
      path: `/api/v3/files/${fileHash}`,
      method: 'GET',
      headers: {
        'x-apikey': apiKey
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            const attributes = response.data.attributes;
            const stats = attributes.last_analysis_stats;
            
            resolve({
              found: true,
              scanId: response.data.id,
              malicious: stats.malicious + stats.suspicious
            });
          } else {
            console.log(`VirusTotal API returned status ${res.statusCode}`);
            resolve({ found: false });
          }
        } catch (error) {
          console.error('Error parsing VirusTotal API response:', error);
          resolve({ found: false });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error contacting VirusTotal API:', error);
      resolve({ found: false });
    });
    
    req.end();
  });
}

/**
 * Deletes files older than MAX_FILE_AGE_HOURS
 */
export function cleanupTemporaryFiles(): void {
  try {
    if (!fs.existsSync(TEMP_STORAGE_DIR)) return;
    
    const now = Date.now();
    const maxAgeMs = MAX_FILE_AGE_HOURS * 60 * 60 * 1000;
    
    // Process each user directory
    const userDirs = fs.readdirSync(TEMP_STORAGE_DIR);
    
    userDirs.forEach(userId => {
      const userDirPath = path.join(TEMP_STORAGE_DIR, userId);
      if (!fs.statSync(userDirPath).isDirectory()) return;
      
      // Process each file in the user directory
      const files = fs.readdirSync(userDirPath);
      let hasRemainingFiles = false;
      
      files.forEach(filename => {
        // Skip metadata files
        if (filename.endsWith('.meta.json')) return;
        
        const filePath = path.join(userDirPath, filename);
        const metadataPath = `${filePath}.meta.json`;
        
        // Get file metadata
        try {
          if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as FileMetadata;
            
            // Check if file is expired
            if (now - metadata.uploadTime > maxAgeMs) {
              console.log(`Deleting expired file: ${filePath}`);
              // Delete file and its metadata
              fs.unlinkSync(filePath);
              fs.unlinkSync(metadataPath);
            } else {
              hasRemainingFiles = true;
            }
          } else {
            // No metadata, consider the file orphaned
            console.log(`Deleting orphaned file: ${filePath}`);
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
          hasRemainingFiles = true;
        }
      });
      
      // Delete empty user directories
      if (!hasRemainingFiles) {
        try {
          console.log(`Removing empty user directory: ${userDirPath}`);
          fs.rmdirSync(userDirPath);
        } catch (error) {
          console.error(`Error removing user directory ${userDirPath}:`, error);
        }
      }
    });
  } catch (error) {
    console.error('Error during temporary file cleanup:', error);
  }
}

/**
 * Sets up a recurring job to clean up temporary files
 * Note: In serverless environments like Vercel, this won't work as expected 
 * since functions don't run continuously. Consider using a cron job or webhook instead.
 */
export function initializeFileCleanupSchedule(): void {
  // Clean up immediately on startup
  cleanupTemporaryFiles();
  
  // Only set up interval in development or when not in Vercel environment
  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === undefined) {
    // Set up recurring cleanup
    const intervalMs = FILE_CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000;
    setInterval(cleanupTemporaryFiles, intervalMs);
    console.log(`Scheduled file cleanup every ${FILE_CLEANUP_INTERVAL_HOURS} hours`);
  } else {
    console.log('File cleanup scheduling skipped - not supported in serverless environment');
  }
}

/**
 * Validates an uploaded file
 */
export function validateUploadedFile(file: { size: number; type: string }): { valid: boolean; message?: string } {
  // Check file size
  const maxSizeBytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, message: `File exceeds the maximum size of ${MAX_UPLOAD_SIZE_MB}MB` };
  }
  
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, message: `File type ${file.type} is not allowed` };
  }
  
  return { valid: true };
}

/**
 * Initialize the file security module
 */
export function initializeFileSecurity(): void {
  // Ensure the temp storage directory exists
  ensureTempDir();
  
  // Set up file cleanup schedule
  initializeFileCleanupSchedule();
} 