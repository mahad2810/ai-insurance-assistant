# Deployment Guide for AI Insurance Assistant

This guide explains how to deploy this application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register) (for the database)
3. A [Google Cloud account](https://console.cloud.google.com/) (for Gemini API and Translation API)
4. A [VirusTotal account](https://www.virustotal.com/gui/join-us) (optional, for file scanning)

## Step 1: Fork or Clone the Repository

First, fork or clone this repository to your GitHub account.

## Step 2: Set Up MongoDB Atlas

1. Create a new MongoDB Atlas cluster
2. Configure network access to allow connections from anywhere
3. Create a database user with read/write permissions
4. Create a database called `bajaj_hack` with collections:
   - `users` - for user accounts
   - `chat_sessions` - for storing chat sessions
   - `messages` - for individual messages
5. Get your MongoDB connection string in the format:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/bajaj_hack
   ```

> **Note:** The application is configured to specifically use the database name `bajaj_hack` and collection name `users`. The connection string will be modified if necessary to ensure the correct database is used.

## Step 3: Set Up Environment Variables

You'll need to add these environment variables in the Vercel dashboard:

### Required Environment Variables

| Variable Name | Description |
|---------------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `MONGODB_URI` | MongoDB connection string (application will use bajaj_hack database) |
| `NEXTAUTH_SECRET` | A random string for NextAuth (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | The full URL of your deployed application (e.g., https://your-app.vercel.app) |

### Authentication (For Google OAuth)

| Variable Name | Description |
|---------------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Optional Environment Variables

| Variable Name | Description |
|---------------|-------------|
| `VIRUS_TOTAL_API_KEY` | VirusTotal API key for file scanning |
| `GOOGLE_APPLICATION_CREDENTIALS_BASE64` | Base64-encoded Google Cloud service account key |
| `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud project ID |

## Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click "Import Project" or "Add New Project"
3. Select your repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (should be automatic)
   - **Output Directory**: `.next` (should be automatic)
   - **Environment Variables**: Add all the variables from Step 3
5. Click "Deploy"

## Step 5: Configure Custom Domain (Optional)

1. In the Vercel dashboard, go to your project
2. Click on "Domains"
3. Add your custom domain and follow the instructions

## Troubleshooting

### File Handling in Vercel

This application uses the `/tmp` directory for temporary file storage in the production environment. Note that:

1. The `/tmp` directory is the only writable location in Vercel's serverless functions
2. Files in `/tmp` are not persisted between function invocations
3. The temporary file cleanup functionality works differently in production compared to development

### MongoDB Connection Issues

If you experience MongoDB connection issues:
1. Check that your IP whitelist in MongoDB Atlas includes `0.0.0.0/0` (all IPs)
2. Verify that your database user has the correct permissions
3. Make sure your connection string is correctly formatted in the environment variables
4. Confirm the database name in your connection string - the application is set to use `bajaj_hack`

### NextAuth Configuration

If authentication isn't working:
1. Make sure `NEXTAUTH_URL` is set to the actual URL of your deployed application
2. Check that `NEXTAUTH_SECRET` is properly set
3. Verify OAuth provider settings (redirect URIs, etc.)

## Updating Your Deployment

Vercel automatically deploys new versions when you push changes to your repository. To update environment variables:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Environment Variables"
3. Add, edit, or remove variables as needed
4. Click "Save" and redeploy if necessary 