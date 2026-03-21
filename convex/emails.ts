import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generateDraft = action({
  args: {
    incomingEmailText: v.string(),
    name: v.string(),
    skills: v.array(v.string()),
    experienceLevel: v.string(),
    resumeSummary: v.string(),
    hasResume: v.boolean(),
    tone: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key is missing");

    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a professional career assistant.

      User Profile:
      Name: ${args.name}
      Skills: ${args.skills.join(", ")}
      Experience: ${args.experienceLevel}
      Resume Summary: ${args.resumeSummary}
      Has Resume Attached: ${args.hasResume ? "YES (Must mention 'I have attached my resume' in the email)" : "NO"}

      Task:
      1. Analyze the incoming email below.
      2. Draft a reply in a ${args.tone} tone.
      3. If the email implies a job application or request for more info, and "Has Resume Attached" is YES, ensure the body text clearly states the resume is attached.
      4. Return ONLY the JSON object with "subject" and "body".

      Incoming Email:
      "${args.incomingEmailText}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ["subject", "body"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");

    const data = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());

    await ctx.runMutation(api.emails.saveDraft, {
      sessionId: args.sessionId,
      subject: data.subject,
      body: data.body,
      tone: args.tone,
    });

    return { subject: data.subject, body: data.body, tone: args.tone };
  },
});

export const saveDraft = mutation({
  args: {
    sessionId: v.string(),
    subject: v.string(),
    body: v.string(),
    tone: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailDrafts", { ...args, createdAt: Date.now() });
  },
});

export const getDraftCount = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const drafts = await ctx.db
      .query("emailDrafts")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    return drafts.length;
  },
});

export const scanInbox = action({
  args: {
    skills: v.array(v.string()),
    experienceLevel: v.string(),
  },
  handler: async (ctx, { skills, experienceLevel }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return [
        {
          id: "email-1",
          sender: "Sarah from TechCorp",
          subject: "Interview Invitation: Senior Frontend Developer",
          snippet: "Hi, we were impressed by your profile...",
          fullBody:
            "Hi,\n\nWe reviewed your application for the Senior Frontend Developer role and would like to schedule an initial interview. Please let us know your availability for next week.\n\nBest,\nSarah",
          date: "Today, 10:30 AM",
          priority: "High",
        },
        {
          id: "email-2",
          sender: "LinkedIn Job Alerts",
          subject: "30+ New Jobs match your skills",
          snippet: "Check out these new roles...",
          fullBody: "Here are the latest jobs matching your skills...",
          date: "Yesterday",
          priority: "Low",
        },
      ];
    }

    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Simulate scanning a Gmail inbox for a job seeker.
      Generate 4 realistic, distinct incoming emails from recruiters, HR managers, or job platforms for a candidate with these skills: ${skills.join(", ")}.
      The candidate is a ${experienceLevel}.

      The emails should vary:
      1. A direct outreach from a recruiter for a relevant role.
      2. A follow-up asking for availability for an interview.
      3. A rejection or update.
      4. A "See if you're a fit" automated message.

      Return a valid JSON array. Each object must have:
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
        model: "gemini-2.5-flash",
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
                priority: {
                  type: Type.STRING,
                  enum: ["High", "Medium", "Low"],
                },
              },
              required: ["id", "sender", "subject", "fullBody", "date", "priority"],
            },
          },
        },
      });

      const text = response.text;
      if (!text) return [];
      return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch (error) {
      console.error("Error scanning inbox:", error);
      return [];
    }
  },
});
