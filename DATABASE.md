# Database Integration - User Profile Persistence

## Overview

User profiles are now automatically saved to PostgreSQL database with full CRUD operations via REST API.

## Features

✅ **Automatic Profile Saving**
- Profile automatically saves to database when user makes changes
- Auto-load profile on login
- No manual save button needed

✅ **Google OAuth Integration**
- User info saved to database on first login
- Email used as unique identifier
- Profile linked to Google account

✅ **Data Persistence**
- All profile data stored in PostgreSQL
- Survives browser refresh
- Accessible from any device

✅ **Database Schema Auto-Initialization**
- Database tables created automatically on server start
- No manual SQL execution needed

---

## Database Schema

### Tables

#### `users` table
Stores Google OAuth user information.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `user_profiles` table
Stores job seeker profile information.

```sql
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) UNIQUE NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  name VARCHAR(255),
  location VARCHAR(255),
  about_me TEXT,
  skills JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  resume_data TEXT,
  resume_mime_type VARCHAR(100),
  resume_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
- `idx_users_email` - Fast user lookups by email
- `idx_user_profiles_email` - Fast profile lookups by email

### Triggers
- Auto-update `updated_at` timestamp on row updates

---

## API Endpoints

### User Management

#### Create/Update User (POST /api/users)
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://..."
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

### Profile Management

#### Get Profile (GET /api/profiles/:email)
**Response:**
```json
{
  "name": "John Doe",
  "location": "San Francisco, CA",
  "aboutMe": "Senior Software Engineer...",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": [
    {
      "role": "Senior Engineer",
      "company": "Tech Corp",
      "duration": "2020-2024",
      "description": "Led development..."
    }
  ],
  "education": [
    {
      "degree": "BS Computer Science",
      "school": "Stanford University",
      "year": "2020"
    }
  ],
  "resumeData": "base64...",
  "resumeMimeType": "application/pdf",
  "resumeName": "resume.pdf"
}
```

#### Save Profile (POST /api/profiles)
```json
{
  "email": "user@example.com",
  "profile": {
    "name": "John Doe",
    "location": "San Francisco, CA",
    "aboutMe": "...",
    "skills": [...],
    "experience": [...],
    "education": [...]
  }
}
```

#### Delete Profile (DELETE /api/profiles/:email)
**Response:**
```json
{
  "success": true,
  "message": "Profile deleted"
}
```

---

## Frontend Integration

### Auto-Save Functionality

Profile changes trigger automatic save to database:

```typescript
const handleProfileChange = async (updatedProfile: UserProfile) => {
  setUserProfile(updatedProfile);

  // Auto-save to database
  if (user?.email) {
    await profileService.saveUserProfile(user.email, updatedProfile);
  }
};
```

### Auto-Load on Login

Profile automatically loads when user logs in:

```typescript
useEffect(() => {
  if (isAuthenticated && user?.email) {
    loadUserProfile();
    profileService.saveUser(user.email, user.name, user.picture);
  }
}, [isAuthenticated, user]);
```

### Loading State

Shows spinner while loading profile from database:

```typescript
if (isLoadingProfile) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-600">Loading your profile...</p>
      </div>
    </div>
  );
}
```

---

## Data Flow

### User Login Flow
```
1. User signs in with Google OAuth
   ↓
2. Frontend receives user info (name, email, picture)
   ↓
3. Frontend calls POST /api/users
   ↓
4. Backend saves user to database
   ↓
5. Frontend calls GET /api/profiles/:email
   ↓
6. Backend returns saved profile (or null if new user)
   ↓
7. Frontend displays profile data
```

### Profile Save Flow
```
1. User edits profile (adds skill, experience, etc.)
   ↓
2. Frontend calls handleProfileChange
   ↓
3. State updates immediately (optimistic update)
   ↓
4. Frontend calls POST /api/profiles
   ↓
5. Backend saves to PostgreSQL
   ↓
6. Console logs "Profile saved to database"
```

### Profile Load Flow
```
1. User logs in
   ↓
2. Frontend sets isLoadingProfile = true
   ↓
3. Shows loading spinner
   ↓
4. Calls GET /api/profiles/:email
   ↓
5. Backend queries PostgreSQL
   ↓
6. Returns profile data
   ↓
7. Frontend updates state
   ↓
8. Sets isLoadingProfile = false
   ↓
9. Shows profile page with data
```

---

## File Structure

### Backend Files

**Database:**
- `backend/src/schema.sql` - Database schema definition
- `backend/src/db.ts` - PostgreSQL connection pool
- `backend/src/initDb.ts` - Schema initialization

**Services:**
- `backend/src/profileService.ts` - Profile CRUD operations
- `backend/src/server.ts` - API endpoints

**Functions:**
- `upsertUser()` - Create or update user
- `getUserProfile()` - Get profile by email
- `upsertUserProfile()` - Create or update profile
- `deleteUserProfile()` - Delete profile

### Frontend Files

**Services:**
- `services/profileService.ts` - API client for profiles

**Functions:**
- `saveUser()` - Save user to database
- `getUserProfile()` - Fetch profile from database
- `saveUserProfile()` - Save profile to database
- `deleteUserProfile()` - Delete profile from database

**Components:**
- `App.tsx` - Profile loading and auto-save logic
- `context/AuthContext.tsx` - Authentication state

---

## Usage Example

### For New Users

1. User signs in with Google
2. Backend creates user record
3. Profile page shows empty (no saved profile)
4. User fills out profile information
5. Each change auto-saves to database
6. User can close browser and return later
7. Profile loads automatically on next login

### For Returning Users

1. User signs in with Google
2. Frontend shows "Loading your profile..." spinner
3. Backend fetches profile from database
4. Profile page displays with all saved information
5. Any changes auto-save immediately

---

## Database Connection

### Connection String Format
```
postgresql://username:password@host:port/database
```

### Example
```
DATABASE_URL=postgresql://postgres:abc123@localhost:5432/jobsenseai
```

### Environment Variable
Set in `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:abc123@localhost:5432/jobsenseai
```

---

## Database Initialization

Database schema is automatically initialized when the server starts.

### Automatic Initialization
```typescript
async function startServer() {
  await initializeDatabase();  // Creates tables if not exist
  app.listen(PORT);
}
```

### Manual Initialization (Optional)
```bash
cd backend
npx tsx src/initDb.ts
```

---

## Testing Profile Persistence

### Test Steps

1. **Login**: Sign in with Google OAuth
2. **Create Profile**: Add skills, experience, education
3. **Verify Auto-Save**: Check console for "Profile saved to database"
4. **Logout**: Click logout button in sidebar
5. **Login Again**: Sign in with same Google account
6. **Verify Load**: Profile should load automatically with all data

### Expected Behavior

✅ Profile saves automatically on every change
✅ No manual save button needed
✅ Profile loads on login
✅ Data persists across browser sessions
✅ Data persists across devices (same Google account)

---

## Error Handling

### Profile Not Found (404)
- Returns `null` from `getUserProfile()`
- Frontend displays empty profile for new users

### Database Connection Error
- Server logs error and exits
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running

### Save Failure
- Error logged to console
- User sees current state (optimistic update)
- Can retry by making another change

---

## Security

🔒 **Database Credentials**
- Stored in `backend/.env` (not in git)
- Never exposed to frontend
- Only backend can access database

🔒 **User Isolation**
- Profiles linked to email (unique identifier)
- Users can only access their own profile
- Email from Google OAuth (trusted source)

🔒 **SQL Injection Protection**
- Using parameterized queries (`$1, $2, etc.`)
- No raw SQL from user input

---

## Future Enhancements

- [ ] Add authentication middleware (JWT)
- [ ] Add profile sharing (public profiles)
- [ ] Add profile version history
- [ ] Add profile export (JSON/PDF)
- [ ] Add profile search (recruiter feature)
- [ ] Add caching layer (Redis)
- [ ] Add rate limiting on API endpoints

---

## Troubleshooting

### Profile not saving?
1. Check browser console for errors
2. Check backend logs: `cd backend && npm run dev`
3. Verify database connection: `GET /api/db/test`
4. Check PostgreSQL is running

### Profile not loading?
1. Check network tab in browser DevTools
2. Verify API endpoint returns 200 or 404
3. Check email matches Google account
4. Try logout and login again

### Database connection failed?
1. Ensure PostgreSQL is running
2. Verify `DATABASE_URL` in `backend/.env`
3. Test connection: `psql -U postgres -d jobsenseai`
4. Create database if needed: `CREATE DATABASE jobsenseai;`

---

## Summary

User profiles are now fully integrated with PostgreSQL database:

✅ Automatic save on every change
✅ Automatic load on login
✅ Data persistence across sessions
✅ Secure backend storage
✅ REST API architecture
✅ Auto-initializing database schema

Users can now safely create and maintain their job search profiles with confidence that their data is securely stored and accessible from anywhere!
