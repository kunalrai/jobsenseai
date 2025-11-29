
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

export interface UserProfile {
  name?: string;
  aboutMe: string;
  location: string;
  skills?: string[];
  experience?: ExperienceItem[];
  education?: EducationItem[];

  // Contact Details
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;

  resumeData?: string; // Base64 string
  resumeMimeType?: string;
  resumeName?: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  searchEntryPoint?: {
    renderedContent?: string;
  };
}

export interface SearchResult {
  text: string;
  groundingMetadata?: GroundingMetadata;
}

export enum AppView {
  PROFILE = 'PROFILE',
  JOBS = 'JOBS',
  EMAIL = 'EMAIL',
  RESUME_BUILDER = 'RESUME_BUILDER',
}

export enum RequestStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface JobSearchParams {
  profileText: string;
  location: string;
  resumeImage?: string;
  resumeMimeType?: string;
}

export enum SearchStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type EmailCategory = 'INTERVIEW_REQUEST' | 'JOB_OFFER' | 'APPLICATION_UPDATE' | 'REJECTION' | 'OTHER';

export interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  // Analysis fields
  category?: EmailCategory;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  summary?: string;
  suggestedAction?: string;
}
