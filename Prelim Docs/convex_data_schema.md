## Convex Data Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    householdId: v.optional(v.id("households")),
  }).index("by_clerk_id", ["clerkId"]),

  households: defineTable({
    name: v.string(),
    inviteCode: v.string(), // e.g., "PUNK69"
  }).index("by_invite_code", ["inviteCode"]),

  cats: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    photoUrl: v.optional(v.string()),
  }).index("by_household", ["householdId"]),

  // Flexible task configuration created during setup/settings
  tasks: defineTable({
    catId: v.id("cats"),
    title: v.string(), // e.g., "Morning Kibble", "Insulin"
    type: v.string(), // "checkbox", "counter"
    frequency: v.number(), // How many times a day? e.g., 2
    config: v.optional(v.any()), // JSON for specific meds, dosages, etc.
  }).index("by_cat", ["catId"]),

  // The actual events of roommates doing the chores
  taskLogs: defineTable({
    taskId: v.id("tasks"),
    catId: v.id("cats"),
    userId: v.id("users"),
    completedAt: v.number(), // Unix timestamp
    dateString: v.string(), // "YYYY-MM-DD" local timezone string for easy daily filtering
    value: v.optional(v.number()), // For counter types
  }).index("by_task_and_date", ["taskId", "dateString"])
    .index("by_cat_and_date", ["catId", "dateString"]),
});