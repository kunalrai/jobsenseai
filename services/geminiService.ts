
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { UserProfile, SearchResult, EmailMessage } from "../types";

const GEMINI_MODEL = "gemini-2.5-flash";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseResume = async (base64Data: string, mimeType: string): Promise<Partial<UserProfile>> => {
  const ai = getClient();
  
  // Clean base64 string
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
            {
                inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType,
                }
            },
            {
                text: `
                Analyze the attached resume and extract the following information into a structured JSON format:
                1. Full Name
                2. Professional Summary (About Me) - Keep it under 400 characters.
                3. Current Location (City, Country)
                4. Key Skills (Array of strings, max 10 most important)
                5. Work Experience (Array of objects: role, company, duration, description). Summarize description to 1 sentence.
                6. Education (Array of objects: degree, school, year)
                `
            }
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
            skills: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
            },
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

  const { aboutMe, location, resumeData, resumeMimeType, skills, experience, name } = profile;

  // Build a rich context string from the structured profile
  let structuredContext = `Candidate Name: ${name || "N/A"}\n`;
  if (skills && skills.length > 0) {
      structuredContext += `Skills: ${skills.join(", ")}\n`;
  }
  if (experience && experience.length > 0) {
      structuredContext += `Recent Experience:\n`;
      experience.slice(0, 3).forEach(exp => {
          structuredContext += `- ${exp.role} at ${exp.company} (${exp.duration}): ${exp.description}\n`;
      });
  }

  // Construct the prompt
  const basePrompt = `
    You are an expert technical recruiter and career coach.
    
    Task: Find 5-8 highly relevant, currently active job listings based on the candidate's profile.
    
    Candidate Profile Summary:
    "${aboutMe}"
    
    Detailed Context:
    ${structuredContext}
    
    Target Location: ${location || "Remote / Worldwide"}
    
    Instructions:
    1. Use the Google Search tool to find REAL, ACTIVE job listings that match the profile skills and experience.
    2. Prioritize jobs posted within the last 30 days.
    3. Output the results in a clean, structured Markdown format.
    4. For each job, provide:
       - **Job Title** at **Company Name**
       - **Location**
       - **Match Score** (e.g., 95% Match)
       - A brief 1-sentence explanation of why it's a good fit.
       - A direct link to the application page if found (embed in the title or company name).
    5. At the end, provide a brief "Career Tip" based on the profile gaps or strengths found.
    
    Do not invent jobs. Only return jobs you find via search.
  `;

  const parts: any[] = [{ text: basePrompt }];

  // Add resume if provided (Multimodal fallback if parsing missed something)
  if (resumeData && resumeMimeType) {
    const base64Data = resumeData.includes(',') ? resumeData.split(',')[1] : resumeData;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: resumeMimeType,
      },
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: parts,
      },
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7, 
      },
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

export const generateEmail = async (
  profile: UserProfile, 
  jobDescription: string, 
  type: 'cover_letter' | 'cold_email'
): Promise<string> => {
  const ai = getClient();
  const { aboutMe, resumeData, resumeMimeType, skills, experience, name } = profile;

  const typeLabel = type === 'cover_letter' ? "Cover Letter" : "Cold Outreach Email";
  
  // Build context
  let profileContext = `Name: ${name || "Candidate"}\nSummary: ${aboutMe}\n`;
  if (skills) profileContext += `Skills: ${skills.join(", ")}\n`;
  if (experience && experience.length > 0) {
      const recent = experience[0];
      profileContext += `Current/Recent Role: ${recent.role} at ${recent.company}\n`;
  }

  const prompt = `
    You are a professional career coach and copywriter.
    
    Task: Write a compelling ${typeLabel} for the following job description.
    
    Job Description / Context:
    "${jobDescription}"
    
    My Profile Context:
    ${profileContext}
    
    Instructions:
    1. Tone should be professional, confident, yet approachable.
    2. Highlight relevant skills from my profile that match the job description.
    3. Keep it concise (under 300 words).
    4. Use placeholders like [Hiring Manager Name] where appropriate.
    5. Output in Markdown.
  `;

  const parts: any[] = [{ text: prompt }];

  if (resumeData && resumeMimeType) {
    const base64Data = resumeData.includes(',') ? resumeData.split(',')[1] : resumeData;
    parts.push({
        inlineData: {
            data: base64Data,
            mimeType: resumeMimeType,
        },
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts },
      config: {
        temperature: 0.7,
      },
    });
    return response.text || "Could not generate email.";
  } catch (error) {
    console.error("Gemini Email Gen Error:", error);
    throw error;
  }
};

export const generateTailoredResume = async (
  profile: UserProfile,
  jobDescription: string
): Promise<string> => {
  const ai = getClient();
  const { aboutMe, resumeData, resumeMimeType, experience, skills } = profile;

  let profileContext = `Summary: ${aboutMe}\n`;
  if (skills) profileContext += `Skills: ${skills.join(", ")}\n`;
  if (experience) profileContext += `Experience: ${JSON.stringify(experience)}\n`;

  const prompt = `
    You are an expert Resume Writer and ATS (Applicant Tracking System) specialist.

    Task: 
    1. Analyze the Target Job Description (JD).
    2. Analyze the Candidate Profile.
    3. Create a **Skills Gap Analysis Table** comparing the JD's top 5 requirements vs the Candidate's current match.
    4. Rewrite the Candidate's Resume to specifically target this job.

    Target Job Description:
    "${jobDescription}"

    Candidate Context:
    ${profileContext}

    Output Format (Markdown):
    
    # Match Analysis
    (Create a table with columns: 'Key Requirement from JD', 'Candidate Match Level', 'Notes/Suggestions')

    # Tailored Resume
    (Provide the full rewritten resume content here. 
     - Optimize the Summary/Objective.
     - Reorder or highlight skills that match the JD.
     - Use keywords from the JD naturally.
     - Keep it truthful to the candidate's actual experience, but frame it for this role.)
  `;

  const parts: any[] = [{ text: prompt }];

  if (resumeData && resumeMimeType) {
    const base64Data = resumeData.includes(',') ? resumeData.split(',')[1] : resumeData;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: resumeMimeType,
      },
    });
    parts.push({ text: "Use the detailed history from my attached resume to build the new resume." });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts },
      config: {
        temperature: 0.5,
      },
    });
    return response.text || "Could not generate resume.";
  } catch (error) {
    console.error("Gemini Resume Gen Error:", error);
    throw error;
  }
};

export const analyzeEmails = async (emails: Partial<EmailMessage>[]): Promise<EmailMessage[]> => {
  const ai = getClient();

  const prompt = `
    You are an intelligent email assistant for a job seeker.
    
    Task: Analyze the following list of emails.
    1. Categorize each email (INTERVIEW_REQUEST, JOB_OFFER, APPLICATION_UPDATE, REJECTION, OTHER).
    2. Assign a Priority (HIGH, MEDIUM, LOW). High priority is for interviews and offers.
    3. Provide a 1-sentence summary.
    4. Suggest a short action (e.g. "Reply with availability", "Thank them").

    Input Emails:
    ${JSON.stringify(emails)}

    Output JSON Format (Array):
    [{ "id": "...", "category": "...", "priority": "...", "summary": "...", "suggestedAction": "..." }]
  `;

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
    
    // Merge analysis with original email data
    return emails.map(email => {
      const analysis = analyzedData.find((a: any) => a.id === email.id);
      return { ...email, ...analysis } as EmailMessage;
    });
  } catch (error) {
    console.error("Email Analysis Error:", error);
    return emails as EmailMessage[]; // Fallback
  }
};

export const generateSmartReply = async (email: EmailMessage, profile: UserProfile): Promise<string> => {
  const ai = getClient();
  const { name, experience, resumeData, resumeMimeType } = profile;

  const prompt = `
    You are a professional assistant writing an email reply on behalf of ${name || "the candidate"}.

    Incoming Email from ${email.sender}:
    Subject: ${email.subject}
    Body: "${email.body}"

    Context:
    This email is categorized as ${email.category}.
    My Profile Summary: ${JSON.stringify(experience?.[0] || {})}
    
    Task: Write a polite, professional, and concise reply.
    - If it's an interview request, express enthusiasm and offer flexibility.
    - If it's a rejection, thank them for the opportunity and ask to keep in touch.
    - If it's an offer, express excitement and ask for next steps/details.
    - Mention that I have attached my resume for their reference (I will attach it programmatically).
    
    Output only the email body text. No subject line.
  `;

  const parts: any[] = [{ text: prompt }];

  // Provide resume context if available
  if (resumeData && resumeMimeType) {
    const base64Data = resumeData.includes(',') ? resumeData.split(',')[1] : resumeData;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: resumeMimeType,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts },
    });
    return response.text || "Draft could not be generated.";
  } catch (error) {
    console.error("Smart Reply Error:", error);
    throw error;
  }
};
