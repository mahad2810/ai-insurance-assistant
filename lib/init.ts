/**
 * Application initialization module
 * 
 * This module runs initialization code for various subsystems when the
 * application starts up. It's automatically imported by Next.js in server environments.
 */

import { initializeFileSecurity } from './file-security';
import { logConfiguration } from './env';

// Only run in server environment
if (typeof window === 'undefined') {
  console.log('🚀 Initializing application subsystems...');
  
  try {
    // Initialize file security (virus scanning, temp storage, cleanup)
    initializeFileSecurity();
    
    // Log configuration (with sensitive values redacted)
    logConfiguration();
    
    console.log('✅ Initialization complete');
  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
}

export {}; // This file is a module 