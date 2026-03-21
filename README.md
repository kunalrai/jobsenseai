<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# JobSense AI

An intelligent career assistant that helps job seekers find roles, analyze recruiter emails, draft professional responses, and manage their professional profile — powered by Google Gemini and Convex.

## Features

- **AI Job Search** — Combines a curated job database with live Google Search grounding via Gemini to surface real, active listings matched to your skills
- **Email Assistant** — Paste or scan recruiter emails; Gemini drafts a professional reply in your chosen tone (professional, casual, enthusiastic, negotiation)
- **Resume Upload & Parsing** — Upload a PDF and Gemini automatically extracts your name, skills, work history, education, and projects
- **AI Resume Enhancer** — One-click improvement of your professional summary using Gemini
- **Persistent Profile** — Your profile, resume, job search history, and email drafts are stored in Convex and survive page refreshes

## Tech Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS
- **Backend** — [Convex](https://convex.dev) (database, file storage, server-side functions)
- **AI** — Google Gemini 2.5 Flash (`@google/genai`) with Google Search grounding

## Local Development

**Prerequisites:** Node.js, a [Convex account](https://dashboard.convex.dev), a [Gemini API key](https://aistudio.google.com/apikey)

### 1. Install dependencies
```bash
npm install
```

### 2. Initialize Convex (first time only)
```bash
npx convex dev
```
This will prompt you to log in and create a project. It writes `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` to `.env.local` automatically. Keep this terminal running.

### 3. Set the Gemini API key on Convex
The API key lives on the server — it is never exposed in the browser bundle.
```bash
npx convex env set GEMINI_API_KEY "your-key-here"
```

### 4. Start the app
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
convex/          # Backend — Convex schema, queries, mutations, actions
  schema.ts      # Database tables: users, jobSearches, emailDrafts
  users.ts       # Profile CRUD + file storage (resume upload)
  jobs.ts        # Gemini job search action + search history
  emails.ts      # Gemini email draft + inbox scan actions
  resume.ts      # Gemini resume parsing + summary improvement

components/      # React UI components
services/        # Legacy Gemini client (kept for reference)
data/            # Curated job database
types.ts         # Shared TypeScript interfaces
```

## Environment Variables

| Variable | Where to set | Description |
|---|---|---|
| `VITE_CONVEX_URL` | `.env.local` (auto-set by Convex CLI) | Convex deployment client URL |
| `GEMINI_API_KEY` | Convex environment (`npx convex env set`) | Google Gemini API key — server-side only |
