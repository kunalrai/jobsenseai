import { action } from "./_generated/server";
import { v } from "convex/values";

export const parseUploadedResume = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key is missing");

    const blob = await ctx.storage.get(storageId);
    if (!blob) throw new Error("File not found in storage");

    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    // Convert blob to base64
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "application/pdf", data: base64 } },
          { text: prompt },
        ],
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
                  description: { type: Type.STRING },
                },
                required: ["role", "company", "duration"],
              },
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  year: { type: Type.STRING },
                },
                required: ["degree", "institution"],
              },
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  technologies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  link: { type: Type.STRING },
                },
                required: ["name", "description"],
              },
            },
          },
          required: ["skills", "resumeSummary", "experienceLevel"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response generated for resume parsing");

    const data = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());

    const now = Date.now();
    return {
      ...data,
      workExperience: (data.workExperience ?? []).map(
        (item: Record<string, string>, idx: number) => ({
          ...item,
          id: `work-${now}-${idx}`,
          description: item.description ?? "",
        })
      ),
      education: (data.education ?? []).map(
        (item: Record<string, string>, idx: number) => ({
          ...item,
          id: `edu-${now}-${idx}`,
          year: item.year ?? "",
        })
      ),
      projects: (data.projects ?? []).map(
        (item: Record<string, unknown>, idx: number) => ({
          ...item,
          id: `proj-${now}-${idx}`,
        })
      ),
    };
  },
});

export const improveSummary = action({
  args: {
    currentSummary: v.string(),
    skills: v.array(v.string()),
  },
  handler: async (ctx, { currentSummary, skills }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key is missing");

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Rewrite the following professional summary to be more impactful, concise, and keyword-rich based on these skills: ${skills.join(", ")}.

      Current Summary:
      "${currentSummary}"

      Return only the plain text of the improved summary.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || currentSummary;
  },
});
