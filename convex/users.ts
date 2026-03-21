import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const profileFields = {
  name: v.string(),
  skills: v.array(v.string()),
  experienceLevel: v.string(),
  resumeSummary: v.string(),
  workExperience: v.array(
    v.object({
      id: v.string(),
      role: v.string(),
      company: v.string(),
      duration: v.string(),
      description: v.optional(v.string()),
    })
  ),
  education: v.array(
    v.object({
      id: v.string(),
      degree: v.string(),
      institution: v.string(),
      year: v.optional(v.string()),
    })
  ),
  projects: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      technologies: v.optional(v.array(v.string())),
      link: v.optional(v.string()),
    })
  ),
  resumeName: v.optional(v.string()),
};

export const getProfile = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();
  },
});

export const upsertProfile = mutation({
  args: { sessionId: v.string(), ...profileFields },
  handler: async (ctx, { sessionId, ...data }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("users", { sessionId, ...data });
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const setResume = mutation({
  args: {
    sessionId: v.string(),
    resumeName: v.string(),
    resumeStorageId: v.id("_storage"),
  },
  handler: async (ctx, { sessionId, resumeName, resumeStorageId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { resumeName, resumeStorageId });
    }
  },
});

export const clearResume = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        resumeName: undefined,
        resumeStorageId: undefined,
      });
    }
  },
});

export const getResumeUrl = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (!user?.resumeStorageId) return null;
    return await ctx.storage.getUrl(user.resumeStorageId);
  },
});
