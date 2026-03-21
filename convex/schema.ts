import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    sessionId: v.string(),
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
    resumeStorageId: v.optional(v.id("_storage")),
  }).index("by_session", ["sessionId"]),

  jobSearches: defineTable({
    sessionId: v.string(),
    query: v.string(),
    resultCount: v.number(),
    searchedAt: v.number(),
  }).index("by_session", ["sessionId"]),

  emailDrafts: defineTable({
    sessionId: v.string(),
    subject: v.string(),
    body: v.string(),
    tone: v.string(),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),
});
