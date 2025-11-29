# JobSense AI Backend

Secure backend API server for JobSense AI application with PostgreSQL database and Gemini API proxy.

## 🔒 Security Features

- **API Key Protection**: Gemini API key is kept secure on the backend
- **CORS Protection**: Only allows requests from configured frontend URL
- **Environment Variables**: Sensitive data stored in `.env` (not committed to git)

## 📋 Prerequisites

- Node.js 18+ or 20+
- PostgreSQL database running
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:abc123@localhost:5432/jobsenseai

# Gemini API Key (secure on backend)
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The backend will start on `http://localhost:3001`

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Check if server is running

### Database
- `GET /api/db/test` - Test PostgreSQL connection

### Gemini API Proxy

All endpoints use POST method:

- `/api/gemini/parse-resume` - Parse resume from base64 data
- `/api/gemini/search-jobs` - Search for jobs based on profile
- `/api/gemini/generate-email` - Generate cover letter or cold email
- `/api/gemini/analyze-emails` - Analyze and categorize emails
- `/api/gemini/smart-reply` - Generate smart email replies

### User Profile Management

User and profile endpoints:

- `POST /api/users` - Create or update user (from Google OAuth)
- `GET /api/profiles/:email` - Get user profile by email
- `POST /api/profiles` - Save user profile to database
- `DELETE /api/profiles/:email` - Delete user profile

## 🗄️ Database Setup

### Create Database

```bash
psql -U postgres
CREATE DATABASE jobsenseai;
```

### Connection String Format

```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://postgres:abc123@localhost:5432/jobsenseai
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── server.ts          # Main Express server
│   ├── db.ts              # PostgreSQL connection
│   ├── geminiService.ts   # Gemini API integration
│   ├── profileService.ts  # User profile database operations
│   ├── initDb.ts          # Database schema initialization
│   ├── schema.sql         # Database schema (tables, indexes)
│   └── types.ts           # TypeScript type definitions
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment template
├── package.json
└── tsconfig.json
```

## 🔧 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

## 🌐 Deployment (Render)

### 1. Push to GitHub

```bash
git add backend/
git commit -m "Add backend"
git push
```

### 2. Create New Web Service on Render

1. Connect your GitHub repository
2. Select the `backend` folder as root directory
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`

### 3. Add Environment Variables

In Render dashboard, add:
- `PORT` = 3001
- `NODE_ENV` = production
- `DATABASE_URL` = (your PostgreSQL connection string)
- `GEMINI_API_KEY` = (your Gemini API key)
- `FRONTEND_URL` = (your frontend Render URL)

### 4. Update Frontend `.env`

```
VITE_API_URL=https://your-backend.onrender.com
```

## 🔐 Security Best Practices

✅ **DO:**
- Keep `.env` in `.gitignore`
- Use environment variables for all secrets
- Restrict CORS to your frontend URL only
- Use HTTPS in production

❌ **DON'T:**
- Commit `.env` file
- Expose API keys in frontend code
- Allow CORS from `*` (all origins)
- Use HTTP in production

## 📝 Notes

- The backend runs on port 3001 by default
- Frontend runs on port 3000
- Both need to run simultaneously for the app to work
- API keys are now secure on the backend (not exposed in browser)

## 🐛 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Make sure PostgreSQL is running:
```bash
# Windows
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start

# Mac
brew services start postgresql

# Linux
sudo service postgresql start
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**: Kill the process using port 3001 or change PORT in `.env`

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Gemini API Documentation](https://ai.google.dev/docs)
