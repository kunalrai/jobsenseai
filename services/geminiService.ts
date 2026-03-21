
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Job, EmailDraft, EmailMessage } from "../types";
import { JOB_DATABASE } from "../data/jobDatabase";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const SEARCH_MODEL = 'gemini-2.5-flash';
const REASONING_MODEL = 'gemini-2.5-flash';

// Helper to safely parse JSON from markdown code blocks if necessary
const cleanJsonString = (str: string) => {
  // Try to extract JSON from markdown block
  const jsonBlockMatch = str.match(/```json\n([\s\S]*?)\n```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }
  // Fallback: simple strip
  return str.replace(/```json\n?|\n?```/g, '').trim();
};

export const searchJobsWithGemini = async (
  profile: UserProfile, 
  query: string
): Promise<Job[]> => {
  
  const q = query.toLowerCase();
  
  // 1. Search Local Database
  // Simple keyword matching
  const localMatches = JOB_DATABASE.filter(job => {
    const content = `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase();
    
    // If query exists, match against query
    if (q) {
        return content.includes(q);
    }
    
    // If no query, match against profile skills
    return profile.skills.some(skill => content.includes(skill.toLowerCase()));
  }).map(job => ({ 
      ...job, 
      matchScore: 95,
      source: 'Curated Database'
  }));

  if (!apiKey) {
      // If no API key, return local results only
      return localMatches;
  }
  
  const prompt = `
    Find 5 active job listings for a candidate with these skills: ${profile.skills.join(', ')}.
    Location preference or keywords: ${query}.
    
    Use Google Search to find real, recent listings.
    Return the results in a valid JSON array format.
    Each item must have: title, company, location, description (short summary), and url.
  `;

  try {
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema are not supported with googleSearch tools
        // We rely on the prompt to get JSON output
      }
    });

    const text = response.text;
    let apiJobs: Job[] = [];
    
    if (text) {
        try {
            const cleanedText = cleanJsonString(text);
            // Sometimes the model returns text before/after JSON, try to find the array
            const arrayStart = cleanedText.indexOf('[');
            const arrayEnd = cleanedText.lastIndexOf(']');
            
            if (arrayStart !== -1 && arrayEnd !== -1) {
                const jsonStr = cleanedText.substring(arrayStart, arrayEnd + 1);
                const data = JSON.parse(jsonStr);
                
                apiJobs = data.map((job: any, index: number) => ({
                    title: job.title || "Unknown Role",
                    company: job.company || "Unknown Company",
                    location: job.location || "Remote",
                    description: job.description || "No description available",
                    url: job.url || "",
                    id: `job-api-${Date.now()}-${index}`,
                    source: 'Google Search',
                    matchScore: 80 // Slightly lower confidence than curated
                }));
            }
        } catch (parseError) {
            console.warn("Failed to parse API search results", parseError);
        }
    }

    // Combine local and API results
    return [...localMatches, ...apiJobs];

  } catch (error) {
    console.error("Error searching jobs:", error);
    // Fallback to local jobs if API fails
    return localMatches;
  }
};

export const analyzeEmailAndDraftResponse = async (
  incomingEmailText: string,
  profile: UserProfile,
  tone: string,
  hasResume: boolean = false
): Promise<EmailDraft> => {
  if (!apiKey) throw new Error("API Key is missing");

  const prompt = `
    You are a professional career assistant.
    
    User Profile:
    Name: ${profile.name}
    Skills: ${profile.skills.join(', ')}
    Experience: ${profile.experienceLevel}
    Resume Summary: ${profile.resumeSummary}
    Has Resume Attached: ${hasResume ? "YES (Must mention 'I have attached my resume' in the email)" : "NO"}

    Task:
    1. Analyze the incoming email below.
    2. Draft a reply in a ${tone} tone.
    3. If the email implies a job application or request for more info, and "Has Resume Attached" is YES, ensure the body text clearly states the resume is attached.
    4. Return ONLY the JSON object with "subject" and "body".

    Incoming Email:
    "${incomingEmailText}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ['subject', 'body']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");

    const data = JSON.parse(cleanJsonString(text));
    return {
      subject: data.subject,
      body: data.body,
      tone: tone as any
    };

  } catch (error) {
    console.error("Error drafting email:", error);
    throw error;
  }
};

export const improveResumeSummary = async (currentSummary: string, skills: string[]): Promise<string> => {
    if (!apiKey) throw new Error("API Key is missing");
    
    const prompt = `
      Rewrite the following professional summary to be more impactful, concise, and keyword-rich based on these skills: ${skills.join(', ')}.
      
      Current Summary:
      "${currentSummary}"
      
      Return only the plain text of the improved summary.
    `;

    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: prompt,
    });

    return response.text || currentSummary;
}

export const scanInboxForOpportunities = async (profile: UserProfile): Promise<EmailMessage[]> => {
  // For demo purposes, mix static "found" opportunities with AI generation if possible.
  // This function primarily mocks the "finding" aspect.
  
  if (!apiKey) {
      // Fallback mock data if no API
      return [
          {
              id: 'email-1',
              sender: 'Sarah form TechCorp',
              subject: 'Interview Invitation: Senior Frontend Developer',
              snippet: 'Hi Alex, we were impressed by your profile...',
              fullBody: 'Hi Alex, \n\nWe reviewed your application for the Senior Frontend Developer role and would like to schedule an initial interview. Please let us know your availability for next week.\n\nBest,\nSarah',
              date: 'Today, 10:30 AM',
              priority: 'High'
          },
          {
              id: 'email-2',
              sender: 'LinkedIn Job Alerts',
              subject: '30+ New Jobs match your skills',
              snippet: 'Check out these new roles in San Francisco...',
              fullBody: 'Here are the latest jobs matching your skills: React, Node.js...',
              date: 'Yesterday',
              priority: 'Low'
          }
      ];
  }

  const prompt = `
    Simulate scanning a Gmail inbox for a job seeker.
    Generate 4 realistic, distinct incoming emails from recruiters, HR managers, or job platforms for a candidate with these skills: ${profile.skills.join(', ')}.
    The candidate is a ${profile.experienceLevel}.
    
    The emails should vary:
    1. A direct outreach from a recruiter for a relevant role.
    2. A follow-up asking for availability for an interview.
    3. A rejection or update.
    4. A "See if you're a fit" automated message.

    Return a valid JSON array.
    Each object must have:
    - id: string (unique)
    - sender: string (Name <email@company.com>)
    - subject: string
    - snippet: string (short preview, max 100 chars)
    - fullBody: string (the full realistic email content)
    - date: string (e.g., "Today, 10:30 AM", "Yesterday")
    - priority: "High" | "Medium" | "Low"
  `;

  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
             type: Type.OBJECT,
             properties: {
                id: { type: Type.STRING },
                sender: { type: Type.STRING },
                subject: { type: Type.STRING },
                snippet: { type: Type.STRING },
                fullBody: { type: Type.STRING },
                date: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
             },
             required: ['id', 'sender', 'subject', 'fullBody', 'date', 'priority']
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(cleanJsonString(text));

  } catch (error) {
    console.error("Error scanning inbox:", error);
    return [];
  }
};

export const parseResume = async (fileBase64: string, mimeType: string): Promise<Partial<UserProfile>> => {
  if (!apiKey) throw new Error("API Key is missing");
  if (mimeType !== "application/pdf") throw new Error(`Unsupported file type: ${mimeType}. Only PDF files are supported.`);

  const prompt = `
    Analyze the attached resume document.
    Extract the following information to populate a user profile:
    1. Full Name (if explicitly stated at the top).
    2. Skills (extract a comprehensive list of technical and soft skills).
    3. Professional Summary (extract the summary/objective if exists, otherwise generate a concise one based on experience).
    4. Experience Level (infer based on years of experience, e.g., "Senior Frontend Engineer", "Junior Designer").
    5. Work Experience (extract the 3 most recent or relevant roles with title, company, duration, and a very brief description).
    6. Education (extract degrees, institutions, and year).
    7. Projects (extract relevant projects with name, description, technologies used, and optional link).

    Return the result in JSON format matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            resumeSummary: { type: Type.STRING },
            experienceLevel: { type: Type.STRING },
            workExperience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  company: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['role', 'company', 'duration']
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  year: { type: Type.STRING }
                },
                required: ['degree', 'institution']
              }
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  link: { type: Type.STRING }
                },
                required: ['name', 'description']
              }
            }
          },
          required: ['skills', 'resumeSummary', 'experienceLevel']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response generated for resume parsing");

    const data = JSON.parse(cleanJsonString(text));

    // Add unique IDs to the list items since the model generates raw objects
    const workExperience = data.workExperience?.map((item: any, idx: number) => ({
      ...item,
      id: `work-${Date.now()}-${idx}`
    })) || [];

    const education = data.education?.map((item: any, idx: number) => ({
      ...item,
      id: `edu-${Date.now()}-${idx}`
    })) || [];
    
    const projects = data.projects?.map((item: any, idx: number) => ({
        ...item,
        id: `proj-${Date.now()}-${idx}`
    })) || [];

    return {
      ...data,
      workExperience,
      education,
      projects
    };

  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};
