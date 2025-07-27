# Security Features

This document describes the security features implemented in the AI Insurance Assistant application.

## Implemented Security Features

### 1. Virus/Malware Scanning

PDF uploads are automatically scanned for malware using the VirusTotal API:

- Hash-based scanning checks if the file has been previously identified as malicious
- Only files passing the security scan are processed
- Configurable via the `VIRUS_TOTAL_API_KEY` environment variable
- Falls back to a warning if scan is unavailable

### 2. Secure Temporary Storage

Uploaded files are stored with enhanced security:

- Files are stored in user-specific directories using hashed user IDs
- Original filenames are replaced with secure, unpredictable names
- Files are automatically cleaned up after a configurable period
- Scheduled cleanup job runs at specified intervals

### 3. Access Control

Strong access control prevents unauthorized file access:

- Files can only be accessed by the user who uploaded them
- File metadata tracks ownership and permissions
- API endpoints verify user identity and authorization before serving files
- All file operations require authentication

### 4. Secrets Management

API keys and sensitive configuration are securely managed:

- Environment variables used for all sensitive configurations
- Centralized configuration management in `lib/env.ts`
- Type validation with zod ensures configuration integrity
- Redacted logging prevents accidental key exposure

## Configuration Options

All security features can be configured through environment variables:

```
# API Keys
GEMINI_API_KEY=your_gemini_api_key
VIRUS_TOTAL_API_KEY=your_virus_total_api_key

# Google Cloud Configuration (Optional)
GOOGLE_APPLICATION_CREDENTIALS=your_credentials_json
GOOGLE_CLOUD_PROJECT_ID=your_project_id

# File Storage Settings
TEMP_FILE_STORAGE_PATH=./temp_storage
FILE_CLEANUP_INTERVAL_HOURS=24
MAX_FILE_AGE_HOURS=48

# Security Settings
MAX_UPLOAD_SIZE_MB=10
ALLOWED_FILE_TYPES=application/pdf
```

## Best Practices

For optimal security:

1. **Always set a VirusTotal API key** to enable malware scanning
2. **Use a dedicated storage directory** outside the web root
3. **Set appropriate file size limits** to prevent DoS attacks
4. **Configure automatic cleanup** to prevent storage exhaustion
5. **Use HTTPS** for all API endpoints

## Future Enhancements

Planned security improvements:

1. Client-side file validation
2. Rate limiting to prevent abuse
3. Content validation for uploaded PDFs
4. Encryption of stored files
5. More granular permission system 