import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    savedNames: v.optional(v.array(v.string())),
    householdId: v.optional(v.id("households")),
  }).index("by_clerk_id", ["clerkId"]),

  households: defineTable({
    name: v.string(),
    inviteCode: v.string(),
  }).index("by_invite_code", ["inviteCode"]),

  cats: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    photoUrl: v.optional(v.string()),
  }).index("by_household", ["householdId"]),

  tasks: defineTable({
    catId: v.id("cats"),
    title: v.string(),
    type: v.string(),
    frequency: v.number(),
    config: v.optional(v.any()),
  }).index("by_cat", ["catId"]),

  taskLogs: defineTable({
    taskId: v.id("tasks"),
    catId: v.id("cats"),
    userId: v.id("users"),
    completedAt: v.number(),
    dateString: v.string(),
    value: v.optional(v.number()),
  })
    .index("by_task_and_date", ["taskId", "dateString"])
    .index("by_cat_and_date", ["catId", "dateString"]),
});