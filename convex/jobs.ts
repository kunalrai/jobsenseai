import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const searchJobs = action({
  args: {
    skills: v.array(v.string()),
    experienceLevel: v.string(),
    query: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, { skills, experienceLevel, query, sessionId }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Find 5 active job listings for a candidate with these skills: ${skills.join(", ")}.
      Experience level: ${experienceLevel}.
      Location preference or keywords: ${query}.

      Use Google Search to find real, recent listings.
      Return the results in a valid JSON array format.
      Each item must have: title, company, location, description (short summary), and url.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });

      const text = response.text;
      if (!text) return [];

      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      const arrayStart = cleanedText.indexOf("[");
      const arrayEnd = cleanedText.lastIndexOf("]");
      if (arrayStart === -1 || arrayEnd === -1) return [];

      const data = JSON.parse(cleanedText.substring(arrayStart, arrayEnd + 1));
      const jobs = data.map((job: Record<string, string>, index: number) => ({
        id: `job-api-${Date.now()}-${index}`,
        title: job.title || "Unknown Role",
        company: job.company || "Unknown Company",
        location: job.location || "Remote",
        description: job.description || "No description available",
        url: job.url || "",
        source: "Google Search",
        matchScore: 80,
      }));

      await ctx.runMutation(api.jobs.saveSearch, {
        sessionId,
        query,
        resultCount: jobs.length,
      });

      return jobs;
    } catch (error) {
      console.error("Error searching jobs:", error);
      return [];
    }
  },
});

export const saveSearch = mutation({
  args: {
    sessionId: v.string(),
    query: v.string(),
    resultCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("jobSearches", { ...args, searchedAt: Date.now() });
  },
});

export const getSearchCount = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const searches = await ctx.db
      .query("jobSearches")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    return searches.reduce((sum, s) => sum + s.resultCount, 0);
  },
});
