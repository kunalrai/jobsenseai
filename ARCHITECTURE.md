# JobSense AI Architecture

## Overview

JobSense AI uses a **completely separated frontend and backend architecture** with API-only communication.

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                    (React + Vite + TypeScript)              │
│                    Port: 3000                               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Login Page   │  │  Components  │  │  Auth Context│     │
│  │ Google OAuth │  │  (UI Layer)  │  │  (State Mgmt)│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │         services/geminiService.ts                │     │
│  │         (API Client - fetch only)                │     │
│  └──────────────────────────────────────────────────┘     │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ HTTP/JSON
                            │ API Calls
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                         BACKEND                             │
│                (Express + PostgreSQL + TypeScript)          │
│                    Port: 3001                               │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │              server.ts                           │     │
│  │         (Express API Endpoints)                  │     │
│  └──────────────────────────────────────────────────┘     │
│                           │                                 │
│  ┌──────────────────────────────────────────────────┐     │
│  │         geminiService.ts                         │     │
│  │    (Gemini AI Integration - SERVER ONLY)        │     │
│  │    🔒 GEMINI_API_KEY stored here                │     │
│  └──────────────────────────────────────────────────┘     │
│                           │                                 │
│  ┌──────────────────────────────────────────────────┐     │
│  │              db.ts                               │     │
│  │         (PostgreSQL Connection Pool)             │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  PostgreSQL   │
                    │   Database    │
                    └───────────────┘
```

---

## Communication Flow

### ✅ Correct Flow (API-Only)

```
User Action
   │
   ▼
Frontend Component
   │
   ▼
services/geminiService.ts
   │
   ▼
fetch() HTTP POST ────────────────────────────► Backend API Endpoint
   │                                                    │
   │                                                    ▼
   │                                           geminiService.ts
   │                                                    │
   │                                                    ▼
   │                                              Gemini API
   │                                                    │
   │◄────────────── JSON Response ──────────────────────┘
   │
   ▼
Display Result
```

### ❌ Wrong Flow (Direct Access - NOT USED)

```
Frontend ──X──> Gemini API Directly  (❌ API key would be exposed)
Frontend ──X──> PostgreSQL Directly  (❌ Database exposed to browser)
```

---

## Frontend Dependencies

**File:** `package.json`

```json
{
  "dependencies": {
    "lucide-react": "^0.554.0",      // Icons only
    "react": "^19.2.0",               // UI framework
    "react-dom": "^19.2.0",           // DOM rendering
    "react-markdown": "^10.1.0"       // Markdown rendering
  }
}
```

**NO backend dependencies:**
- ❌ No `@google/genai`
- ❌ No `express`
- ❌ No `pg` (PostgreSQL)
- ❌ No `cors`

**Frontend only uses:**
- Native `fetch()` API for HTTP requests
- Google OAuth script (loaded from CDN)

---

## Backend Dependencies

**File:** `backend/package.json`

```json
{
  "dependencies": {
    "@google/genai": "^1.30.0",    // Gemini AI SDK
    "cors": "^2.8.5",              // CORS middleware
    "dotenv": "^17.2.3",           // Environment variables
    "express": "^4.18.2",          // Web server
    "pg": "^8.11.3"                // PostgreSQL client
  }
}
```

**Backend handles:**
- All Gemini API calls
- Database connections
- API key security
- CORS protection

---

## API Endpoints

All frontend-to-backend communication happens through these REST API endpoints:

### Health & Database
- `GET /api/health` - Server health check
- `GET /api/db/test` - Database connection test

### Gemini AI Operations
- `POST /api/gemini/parse-resume` - Parse resume files
- `POST /api/gemini/search-jobs` - AI-powered job search
- `POST /api/gemini/generate-email` - Generate cover letters/emails
- `POST /api/gemini/analyze-emails` - Email categorization
- `POST /api/gemini/smart-reply` - Smart email replies

---

## Environment Variables

### Frontend (`.env`)
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_API_URL=http://localhost:3001
```

**Frontend has:**
- ✅ Google OAuth Client ID (public, safe to expose)
- ✅ Backend API URL
- ❌ NO Gemini API key
- ❌ NO Database credentials

### Backend (`backend/.env`)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host:5432/dbname
GEMINI_API_KEY=your_secret_gemini_key
FRONTEND_URL=http://localhost:3000
```

**Backend has:**
- 🔒 Gemini API key (secure, never exposed)
- 🔒 Database credentials (secure, never exposed)
- ✅ CORS whitelist (frontend URL)

---

## Security Features

### 🔒 API Key Protection
- Gemini API key is **only** in backend
- Never sent to browser
- Never in frontend code
- Never in frontend environment variables

### 🔒 CORS Protection
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```
- Only accepts requests from configured frontend URL
- Prevents unauthorized API access

### 🔒 Database Protection
- PostgreSQL connection **only** in backend
- No direct database access from frontend
- Connection pool management server-side

### ✅ OAuth Security
- Google OAuth handled client-side (standard practice)
- User authentication tokens stored in localStorage
- Backend validates all requests (can add JWT middleware later)

---

## Code Organization

### Frontend Structure
```
jobsenseai/
├── components/          # UI components
│   ├── LoginPage.tsx   # Google OAuth login
│   ├── ProfileSection.tsx
│   ├── JobSearchSection.tsx
│   ├── EmailSection.tsx
│   └── Sidebar.tsx     # With user info & logout
├── context/
│   └── AuthContext.tsx # Authentication state
├── services/
│   └── geminiService.ts # ⭐ API client (fetch only)
├── types.ts
├── App.tsx
├── index.tsx
└── package.json        # Frontend deps only
```

### Backend Structure
```
backend/
├── src/
│   ├── server.ts       # Express API server
│   ├── geminiService.ts # 🔒 Gemini AI integration
│   ├── db.ts           # 🔒 PostgreSQL connection
│   └── types.ts        # Shared types
├── package.json        # Backend deps only
├── tsconfig.json
└── .env               # 🔒 Secret credentials
```

---

## Frontend API Client Example

**File:** `services/geminiService.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiCall = async (endpoint: string, data: any) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('API request failed');
  }

  return response.json();
};

export const searchJobs = async (profile: UserProfile) => {
  return apiCall('/api/gemini/search-jobs', { profile });
};
```

**Key points:**
- Uses native `fetch()` - no external libraries
- Only communicates with backend API
- No direct Gemini SDK usage
- No API keys in frontend code

---

## Running the Application

### Development Mode

**Terminal 1 - Frontend:**
```bash
npm run dev
# Starts on http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Starts on http://localhost:3001
```

### Production Deployment

**Frontend (Render/Vercel/Netlify):**
```bash
npm run build
# Outputs static files to dist/
```

**Backend (Render/Railway/Fly.io):**
```bash
cd backend
npm run build  # Compiles TypeScript
npm start      # Runs production server
```

---

## Authentication Flow

1. **User visits app** → Shows LoginPage
2. **Clicks "Sign in with Google"** → Google OAuth popup
3. **Google authenticates** → Returns JWT token
4. **Frontend stores token** → localStorage
5. **Frontend shows main app** → User authenticated
6. **All API calls** → Backend validates (can add JWT middleware)
7. **User clicks logout** → Clears all tokens and state

---

## Benefits of This Architecture

✅ **Security**
- API keys never exposed to browser
- Database credentials secure
- CORS protection prevents unauthorized access

✅ **Scalability**
- Frontend and backend can scale independently
- Can deploy frontend to CDN (static files)
- Backend can handle multiple frontends (web, mobile, etc.)

✅ **Maintainability**
- Clear separation of concerns
- Easy to test backend independently
- Simple deployment process

✅ **Cost Efficiency**
- Frontend is static (cheap to host)
- Backend only runs when needed
- Can add caching/rate limiting on backend

---

## Future Enhancements

- [ ] Add JWT middleware for backend authentication
- [ ] Implement rate limiting on API endpoints
- [ ] Add Redis caching for Gemini responses
- [ ] User data persistence in PostgreSQL
- [ ] WebSocket for real-time job alerts
- [ ] Docker containers for easy deployment

---

## Summary

**Frontend:**
- React SPA with Google OAuth
- Communicates ONLY via fetch() to backend API
- NO backend libraries or API keys

**Backend:**
- Express REST API
- Handles all Gemini AI operations
- Manages PostgreSQL database
- Protects secrets and credentials

**Communication:**
- 100% API-based (HTTP/JSON)
- CORS-protected
- Stateless (can add sessions/JWT later)
