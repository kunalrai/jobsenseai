import { action, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function extractBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    }
    for (const part of payload.parts) {
      const result = extractBody(part);
      if (result) return result;
    }
  }
  return "";
}

function detectPriority(subject: string, snippet: string): string {
  const text = (subject + " " + snippet).toLowerCase();
  if (text.includes("interview") || text.includes("offer") || text.includes("selected")) return "High";
  if (text.includes("application") || text.includes("recruiter") || text.includes("opportunity")) return "Medium";
  return "Low";
}

export const generateDraft = action({
  args: {
    incomingEmailText: v.string(),
    name: v.string(),
    skills: v.array(v.string()),
    experienceLevel: v.string(),
    resumeSummary: v.string(),
    hasResume: v.boolean(),
    tone: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

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

    await ctx.runMutation(internal.emails.saveDraft, {
      tokenIdentifier: identity.tokenIdentifier,
      subject: data.subject,
      body: data.body,
      tone: args.tone,
    });

    return { subject: data.subject, body: data.body, tone: args.tone };
  },
});

export const saveDraft = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    subject: v.string(),
    body: v.string(),
    tone: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailDrafts", { ...args, createdAt: Date.now() });
  },
});

export const fetchGmailEmails = action({
  args: { accessToken: v.string() },
  handler: async (ctx, { accessToken }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=job+OR+interview+OR+offer+OR+application+OR+recruiter+OR+hiring&maxResults=10",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const listData = await listRes.json();
    const messages: { id: string }[] = listData.messages || [];

    const emails: { gmailId: string; from: string; subject: string; snippet: string; body: string; date: string; priority: string }[] = [];

    for (const msg of messages.slice(0, 5)) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgData = await msgRes.json();
      const headers: { name: string; value: string }[] = msgData.payload?.headers || [];
      const from = headers.find((h) => h.name === "From")?.value ?? "";
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "";
      const date = headers.find((h) => h.name === "Date")?.value ?? "";
      const snippet = msgData.snippet ?? "";
      const body = extractBody(msgData.payload);
      const priority = detectPriority(subject, snippet);
      emails.push({ gmailId: msg.id, from, subject, snippet, body, date, priority });
    }

    await ctx.runMutation(internal.emails.saveGmailEmails, {
      tokenIdentifier: identity.tokenIdentifier,
      emails,
    });

    return emails;
  },
});

export const saveGmailEmails = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    emails: v.array(v.object({
      gmailId: v.string(),
      from: v.string(),
      subject: v.string(),
      snippet: v.string(),
      body: v.string(),
      date: v.string(),
      priority: v.string(),
    })),
  },
  handler: async (ctx, { tokenIdentifier, emails }) => {
    const existing = await ctx.db
      .query("gmailEmails")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }
    const fetchedAt = Date.now();
    for (const email of emails) {
      await ctx.db.insert("gmailEmails", { ...email, tokenIdentifier, fetchedAt });
    }
  },
});

export const getGmailEmails = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("gmailEmails")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
  },
});

export const getDraftCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const drafts = await ctx.db
      .query("emailDrafts")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .take(1000);
    return drafts.length;
  },
});

export const scanInbox = action({
  args: {
    skills: v.array(v.string()),
    experienceLevel: v.string(),
  },
  handler: async (ctx, { skills, experienceLevel }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

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
                priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
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
