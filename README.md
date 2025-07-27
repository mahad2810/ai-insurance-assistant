# AI Insurance Assistant

A professional AI-powered assistant for insurance queries and document analysis, featuring advanced security, multilingual support, and voice input capabilities.

![AI Insurance Assistant](public/screenshot.jpg)

## Features

- **Advanced AI Analysis**: Uses Google Gemini 2.5 Pro to analyze insurance documents and answer queries
- **Multilingual Support**: Built-in translation with Google Cloud Translate API
- **Voice Input**: Speech-to-text functionality with automatic language detection
- **PDF Analysis**: Parse and analyze insurance policy documents
- **Security Features**:
  - File virus/malware scanning with VirusTotal
  - Secure temporary file storage
  - User-based access control
  - Secrets management for API keys
- **Modern UI**: ChatGPT-like interface with conversation history
- **Authentication**: User accounts with NextAuth

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: Shadcn UI, Tailwind CSS, Framer Motion
- **Authentication**: NextAuth.js
- **Database**: MongoDB (with Mongoose)
- **AI/ML**: Google Gemini API, Google Cloud Translation API
- **Voice Input**: Web Speech API
- **File Handling**: PDF parsing with pdf-parse
- **Security**: VirusTotal API for file scanning

## Getting Started

### Prerequisites

- Node.js 18.0+ and npm
- MongoDB instance (local or Atlas)
- Google Gemini API key
- Google Cloud service account (for Translation API)
- VirusTotal API key (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-insurance-assistant.git
   cd ai-insurance-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # API Keys
   GEMINI_API_KEY=your_gemini_api_key
   VIRUS_TOTAL_API_KEY=your_virustotal_api_key

   # Google Cloud
   GOOGLE_APPLICATION_CREDENTIALS_BASE64=your_base64_encoded_credentials
   GOOGLE_CLOUD_PROJECT_ID=your_gcp_project_id

   # MongoDB
   MONGODB_URI=your_mongodb_connection_string

   # NextAuth
   NEXTAUTH_SECRET=your_random_string_here
   NEXTAUTH_URL=http://localhost:3000

   # OAuth (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

See the [DEPLOYMENT.md](./DEPLOYMENT.md) file for instructions on how to deploy this project to Vercel.

## Security

This project implements several security best practices:

1. **File Scanning**: Scans uploaded files for viruses/malware using VirusTotal API
2. **Secure File Storage**: Uses proper file handling with temporary storage and automatic cleanup
3. **Access Control**: Files are tied to user IDs and unauthorized access is blocked
4. **Secrets Management**: Centralized environment variable management with proper validation

For more details, see the [SECURITY.md](./SECURITY.md) file.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Google Cloud for Gemini API and Translation API
- VirusTotal for file security scanning
- Shadcn UI for the component library
- NextAuth.js for authentication
- Vercel for hosting 