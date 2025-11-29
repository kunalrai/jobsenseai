import { UserProfile, SearchResult, EmailMessage } from "../types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper function to make API calls to backend
const apiCall = async (endpoint: string, data: any) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
};

export const parseResume = async (base64Data: string, mimeType: string): Promise<Partial<UserProfile>> => {
  try {
    const result = await apiCall('/api/gemini/parse-resume', {
      base64Data,
      mimeType
    });
    return result;
  } catch (error) {
    console.error("Parse Resume Error:", error);
    throw error;
  }
};

export const searchJobs = async (profile: UserProfile): Promise<SearchResult> => {
  try {
    const result = await apiCall('/api/gemini/search-jobs', {
      profile
    });
    return result;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};

export const generateEmail = async (
  profile: UserProfile,
  jobDescription: string,
  type: 'cover_letter' | 'cold_email'
): Promise<string> => {
  try {
    const result = await apiCall('/api/gemini/generate-email', {
      profile,
      jobDescription,
      type
    });
    return result.text;
  } catch (error) {
    console.error("Gemini Email Gen Error:", error);
    throw error;
  }
};

export const generateTailoredResume = async (
  profile: UserProfile,
  jobDescription: string
): Promise<string> => {
  // This function uses the email generation with a different prompt
  // You can add a separate endpoint if needed
  try {
    const result = await apiCall('/api/gemini/generate-email', {
      profile,
      jobDescription,
      type: 'cover_letter' // Reusing for now, can create separate endpoint
    });
    return result.text;
  } catch (error) {
    console.error("Gemini Resume Gen Error:", error);
    throw error;
  }
};

export const analyzeEmails = async (emails: Partial<EmailMessage>[]): Promise<EmailMessage[]> => {
  try {
    const result = await apiCall('/api/gemini/analyze-emails', {
      emails
    });
    return result;
  } catch (error) {
    console.error("Email Analysis Error:", error);
    return emails as EmailMessage[]; // Fallback
  }
};

export const generateSmartReply = async (email: EmailMessage, profile: UserProfile): Promise<string> => {
  try {
    const result = await apiCall('/api/gemini/smart-reply', {
      email,
      profile
    });
    return result.text;
  } catch (error) {
    console.error("Smart Reply Error:", error);
    throw error;
  }
};

// Deprecated function - kept for backwards compatibility
export const improveResumeSummary = async (resumeSummary: string, _skills: string[]): Promise<string> => {
  // This can be implemented as a backend endpoint if needed
  console.warn('improveResumeSummary is deprecated');
  return resumeSummary;
};
