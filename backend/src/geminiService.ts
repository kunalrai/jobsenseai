import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import dotenv from 'dotenv';
import { UserProfile, SearchResult, EmailMessage } from './types.js';

dotenv.config();

const GEMINI_MODEL = "gemini-2.5-flash";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseResume = async (base64Data: string, mimeType: string): Promise<Partial<UserProfile>> => {
  const ai = getClient();
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: mimeType } },
          { text: `Extract: name, location, aboutMe, skills (array), experience (array with role, company, duration, description), education (array with degree, school, year)` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            location: { type: Type.STRING },
            aboutMe: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  company: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  description: { type: Type.STRING },
                }
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  school: { type: Type.STRING },
                  year: { type: Type.STRING },
                }
              }
            }
          }
        }
      },
    });

    const text = response.text;
    if (!text) return {};
    return JSON.parse(text) as Partial<UserProfile>;
  } catch (error) {
    console.error("Parse Resume Error:", error);
    throw error;
  }
};

export const searchJobs = async (profile: UserProfile): Promise<SearchResult> => {
  const ai = getClient();
  const { aboutMe, location, skills, experience, name } = profile;

  let structuredContext = `Candidate Name: ${name || "N/A"}\n`;
  if (skills && skills.length > 0) structuredContext += `Skills: ${skills.join(", ")}\n`;
  if (experience && experience.length > 0) {
    structuredContext += `Recent Experience:\n`;
    experience.slice(0, 3).forEach(exp => {
      structuredContext += `- ${exp.role} at ${exp.company} (${exp.duration}): ${exp.description}\n`;
    });
  }

  const basePrompt = `Find 5-8 job listings for:\n${aboutMe}\n${structuredContext}\nLocation: ${location || "Remote"}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: [{ text: basePrompt }] },
      config: { tools: [{ googleSearch: {} }], temperature: 0.7 },
    });

    return {
      text: response.text || "No results found.",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
    };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};

export const generateEmail = async (profile: UserProfile, jobDescription: string, type: 'cover_letter' | 'cold_email'): Promise<string> => {
  const ai = getClient();
  const { aboutMe, skills, experience, name } = profile;

  const typeLabel = type === 'cover_letter' ? "Cover Letter" : "Cold Email";
  let profileContext = `Name: ${name || "Candidate"}\nSummary: ${aboutMe}\n`;
  if (skills) profileContext += `Skills: ${skills.join(", ")}\n`;
  if (experience && experience.length > 0) {
    const recent = experience[0];
    profileContext += `Current Role: ${recent.role} at ${recent.company}\n`;
  }

  const prompt = `Write a ${typeLabel} for:\n${jobDescription}\n\nMy Profile:\n${profileContext}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: { temperature: 0.7 },
    });
    return response.text || "Could not generate email.";
  } catch (error) {
    console.error("Gemini Email Gen Error:", error);
    throw error;
  }
};

export const analyzeEmails = async (emails: Partial<EmailMessage>[]): Promise<EmailMessage[]> => {
  const ai = getClient();

  const prompt = `Analyze these emails and categorize them:\n${JSON.stringify(emails)}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              priority: { type: Type.STRING },
              summary: { type: Type.STRING },
              suggestedAction: { type: Type.STRING },
            }
          }
        }
      }
    });

    const analyzedData = JSON.parse(response.text || "[]");
    return emails.map(email => {
      const analysis = analyzedData.find((a: any) => a.id === email.id);
      return { ...email, ...analysis } as EmailMessage;
    });
  } catch (error) {
    console.error("Email Analysis Error:", error);
    return emails as EmailMessage[];
  }
};

export const generateSmartReply = async (email: EmailMessage, profile: UserProfile): Promise<string> => {
  const ai = getClient();
  const { name, experience } = profile;

  const prompt = `Write a reply to:\nFrom: ${email.sender}\nSubject: ${email.subject}\n${email.body}\n\nMy name: ${name}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: [{ text: prompt }] },
    });
    return response.text || "Draft could not be generated.";
  } catch (error) {
    console.error("Smart Reply Error:", error);
    throw error;
  }
};
