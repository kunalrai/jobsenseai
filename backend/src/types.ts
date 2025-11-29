export interface UserProfile {
  name?: string;
  location?: string;
  aboutMe?: string;
  skills?: string[];
  experience?: ExperienceItem[];
  education?: EducationItem[];

  // Contact Details
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;

  resumeData?: string;
  resumeMimeType?: string;
  resumeName?: string;
}

export interface ExperienceItem {
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface EducationItem {
  degree: string;
  school: string;
  year: string;
}

export interface EmailMessage {
  id: string;
  sender: string;
  from?: string; // Alias for sender (used in some contexts)
  subject: string;
  body: string;
  snippet?: string; // Alias for body (used in some contexts)
  date: string;
  isRead: boolean;
  category?: string;
  priority?: string;
  summary?: string;
  suggestedAction?: string;
}

export interface SearchResult {
  text: string;
  groundingMetadata?: any;
}
