// Environment variable configuration and validation
import { z } from 'zod';

// Define the schema for environment variables with defaults and validation
const envSchema = z.object({
  // API Keys
  GEMINI_API_KEY: z.string().default('AIzaSyBhAGZ8TTDhnv8aO4XFIV9oKIxFPkU_1w8'),
  VIRUS_TOTAL_API_KEY: z.string().optional(),

  // Google Cloud Configuration
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS_BASE64: z.string().optional(),
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),

  // File Storage Settings
  TEMP_FILE_STORAGE_PATH: z.string().default('./temp_storage'),
  FILE_CLEANUP_INTERVAL_HOURS: z.coerce.number().positive().default(24),
  MAX_FILE_AGE_HOURS: z.coerce.number().positive().default(48),

  // Security Settings
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(10),
  ALLOWED_FILE_TYPES: z.string().default('application/pdf'),

  // Database Configuration
  MONGODB_URI: z.string().optional(),
  
  // Next Auth Configuration
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

// Parse environment variables with fallbacks
const processEnv = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  VIRUS_TOTAL_API_KEY: process.env.VIRUS_TOTAL_API_KEY,
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  GOOGLE_APPLICATION_CREDENTIALS_BASE64: process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  TEMP_FILE_STORAGE_PATH: process.env.TEMP_FILE_STORAGE_PATH,
  FILE_CLEANUP_INTERVAL_HOURS: process.env.FILE_CLEANUP_INTERVAL_HOURS,
  MAX_FILE_AGE_HOURS: process.env.MAX_FILE_AGE_HOURS,
  MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB,
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
  MONGODB_URI: process.env.MONGODB_URI,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

// Parse and validate environment variables
export const env = envSchema.parse(processEnv);

// Function to get sensitive configurations (for more protection)
export function getApiKey(name: 'GEMINI_API_KEY' | 'VIRUS_TOTAL_API_KEY'): string {
  return env[name] || '';
}

// Function to get Google Cloud credentials (handles base64 decoding)
export function getGoogleCredentials(): { credentials?: any, projectId?: string } {
  try {
    // If base64 encoded credentials are provided, decode them
    if (env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
      const credentialsJson = Buffer.from(env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf-8');
      const credentials = JSON.parse(credentialsJson);
      
      // Use project ID from credentials if not explicitly provided
      const projectId = env.GOOGLE_CLOUD_PROJECT_ID || credentials.project_id;
      
      return { credentials, projectId };
    }
    
    // If direct path to credentials file is provided
    if (env.GOOGLE_APPLICATION_CREDENTIALS) {
      return { 
        credentials: env.GOOGLE_APPLICATION_CREDENTIALS,
        projectId: env.GOOGLE_CLOUD_PROJECT_ID
      };
    }
    
    return {};
  } catch (error) {
    console.error('Failed to parse Google Cloud credentials:', error);
    return {};
  }
}

// Print warnings for missing but optional environment variables
export function checkOptionalEnvironmentVariables(): void {
  const warnings = [];
  
  if (!env.VIRUS_TOTAL_API_KEY) {
    warnings.push('⚠️ VIRUS_TOTAL_API_KEY not set - virus scanning will be disabled');
  }
  
  const { credentials, projectId } = getGoogleCredentials();
  if (!credentials || !projectId) {
    warnings.push('⚠️ Google Cloud credentials not fully configured - some features may be limited');
  } else {
    console.log('✅ Google Cloud credentials successfully configured');
  }
  
  if (warnings.length > 0) {
    console.warn('\nEnvironment Variable Warnings:');
    warnings.forEach(warning => console.warn(warning));
    console.warn('');
  }
}

// Print all configuration (with sensitive values redacted)
export function logConfiguration(): void {
  const redactedEnv = {
    ...env,
    GEMINI_API_KEY: env.GEMINI_API_KEY ? '********' : undefined,
    VIRUS_TOTAL_API_KEY: env.VIRUS_TOTAL_API_KEY ? '********' : undefined,
    GOOGLE_APPLICATION_CREDENTIALS: env.GOOGLE_APPLICATION_CREDENTIALS ? '********' : undefined,
    GOOGLE_APPLICATION_CREDENTIALS_BASE64: env.GOOGLE_APPLICATION_CREDENTIALS_BASE64 ? '********' : undefined,
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET ? '********' : undefined,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET ? '********' : undefined,
  };
  
  console.log('📝 Application Configuration:');
  console.log(JSON.stringify(redactedEnv, null, 2));
}

// Check and log environment variables during import
checkOptionalEnvironmentVariables(); 