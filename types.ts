export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  matchScore?: number;
  url?: string;
  source?: string;
}

export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies?: string[];
  link?: string;
}

export interface UserProfile {
  name: string;
  skills: string[];
  experienceLevel: string;
  resumeSummary: string;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  resumeName?: string;
  resumeUrl?: string;
  gmailConnectedAt?: number;
}

export interface EmailDraft {
  subject: string;
  body: string;
  tone: 'professional' | 'casual' | 'enthusiastic' | 'negotiation';
}

export interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  fullBody: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  JOB_SEARCH = 'JOB_SEARCH',
  EMAIL_ASSISTANT = 'EMAIL_ASSISTANT',
  PROFILE = 'PROFILE'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}