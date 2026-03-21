import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
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

async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  },
});

export const upsertProfile = mutation({
  args: profileFields,
  handler: async (ctx, data) => {
    const identity = await requireAuth(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("users", { tokenIdentifier: identity.tokenIdentifier, ...data });
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setResume = mutation({
  args: {
    resumeName: v.string(),
    resumeStorageId: v.id("_storage"),
  },
  handler: async (ctx, { resumeName, resumeStorageId }) => {
    const identity = await requireAuth(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { resumeName, resumeStorageId });
    }
  },
});

export const clearResume = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { resumeName: undefined, resumeStorageId: undefined });
    }
  },
});

export const getResumeUrl = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user?.resumeStorageId) return null;
    return await ctx.storage.getUrl(user.resumeStorageId);
  },
});
