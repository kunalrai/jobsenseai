# Gmail OAuth Setup Guide

## Prerequisites
You need a Google Cloud Project with OAuth 2.0 credentials configured.

## Step-by-Step Setup

### 1. Create/Configure Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Gmail API**:
   - Navigate to **APIs & Services > Library**
   - Search for "Gmail API"
   - Click **Enable**

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in required information:
   - **App name**: JobSense AI
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.compose`
5. Add test users (your email) if in testing mode
6. Save and continue

### 3. Create OAuth 2.0 Client ID

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: JobSense AI Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `http://localhost:5173` (Vite default port)
     - Your production URL (e.g., `https://your-app.onrender.com`)
   - **Authorized redirect URIs**:
     - `http://localhost:3000`
     - `http://localhost:5173`
     - Your production URL
5. Click **Create**
6. Copy the **Client ID** - this goes in your `.env` as `VITE_GOOGLE_CLIENT_ID`

### 4. Create API Key (for Gmail API Discovery)

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Click on the newly created key to configure it:
   - Under **API restrictions**, select **Restrict key**
   - Select **Gmail API** from the dropdown
   - Save
4. Copy the **API Key** - this goes in your `.env` as `VITE_GOOGLE_API_KEY`

### 5. Update Your .env File

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key-here

# Gemini API Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 6. How OAuth Flow Works in the App

1. User clicks "Connect Gmail" button
2. OAuth popup opens (or Mock popup if not configured)
3. User signs in with Google account
4. User grants permissions to read and send emails
5. App receives access token
6. App can now read inbox and send emails on behalf of user

### 7. Testing Locally

1. Make sure your `.env` has the correct credentials
2. Run `npm run dev`
3. Navigate to the **Inbox Agent** tab
4. Click "Connect Gmail"
5. You should see the Google OAuth consent screen
6. Grant permissions
7. App will connect and scan your inbox

### 8. Deploying to Production (Render)

1. Add the same environment variables in Render dashboard:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_API_KEY`
   - `VITE_GEMINI_API_KEY`

2. Update authorized origins in Google Cloud Console:
   - Add your Render URL (e.g., `https://jobsense-ai.onrender.com`)

3. If app is in testing mode:
   - Go to **OAuth consent screen**
   - Click **Publish App** to make it available to all users
   - OR keep it in testing and add users manually

## Troubleshooting

### "403 Forbidden" Error
- Make sure Gmail API is enabled in your project
- Check that API Key has Gmail API restriction set
- Verify the API key is valid

### OAuth Popup Blocked
- Allow popups for localhost in your browser
- Try using the mock mode first (automatically used when credentials not configured)

### "redirect_uri_mismatch" Error
- Make sure the authorized redirect URIs in Google Cloud Console match your app URL exactly
- Include both `http://localhost:3000` and your production URL

### App Shows "Mock Mode"
- This is expected if CLIENT_ID is not configured
- Once you add real credentials, the app will use real Gmail API
- Mock mode is useful for testing the UI without API access

## Security Notes

⚠️ **Important:**
- Never commit your `.env` file to git (already in `.gitignore`)
- The OAuth Client ID can be public (it's safe in frontend code)
- The API Key will be visible in browser - restrict it properly in Google Cloud Console
- For production apps, consider implementing a backend proxy for additional security

## Current Configuration Status

Your current `.env` has:
- ✅ Google Client ID configured
- ✅ Google API Key configured
- ✅ Gemini API Key configured

Next steps:
1. Enable Gmail API in Google Cloud Console
2. Configure authorized origins for your Client ID
3. Restrict your API Key to Gmail API only
4. Test the OAuth flow!
