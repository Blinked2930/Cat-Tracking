import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Configure a new daily routine / task for a specific cat.
 */
export const createTask = mutation({
  args: {
    catId: v.id("cats"),
    title: v.string(),
    type: v.string(), // "checkbox" | "counter"
    frequency: v.number(), // times per day (e.g. 1, 2)
    config: v.optional(v.any()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      catId: Id<"cats">;
      title: string;
      type: string;
      frequency: number;
      config?: any;
    }
  ) => {
    const trimmedTitle = args.title.trim();
    if (!trimmedTitle) {
      throw new Error("Task title is required");
    }

    const taskId = await ctx.db.insert("tasks", {
      catId: args.catId,
      title: trimmedTitle,
      type: args.type || "checkbox",
      frequency: Math.max(1, args.frequency || 1),
      config: args.config,
    });

    return taskId;
  },
});

/**
 * Fetch all tasks configured for a cat.
 */
export const getByCat = query({
  args: { catId: v.id("cats") },
  handler: async (ctx: QueryCtx, args: { catId: Id<"cats"> }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_cat", (q) => q.eq("catId", args.catId))
      .collect();
  },
});

/**
 * Record a chore completion event by a roommate.
 */
export const logTask = mutation({
  args: {
    taskId: v.id("tasks"),
    catId: v.id("cats"),
    dateString: v.string(), // "YYYY-MM-DD"
    value: v.optional(v.number()),
    clerkId: v.optional(v.string()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      taskId: Id<"tasks">;
      catId: Id<"cats">;
      dateString: string;
      value?: number;
      clerkId?: string;
    }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) {
      throw new Error("Must be logged in to log tasks");
    }

    // Find the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      throw new Error("User record not found. Sync user first.");
    }

    // Insert task log
    const logId = await ctx.db.insert("taskLogs", {
      taskId: args.taskId,
      catId: args.catId,
      userId: user._id,
      completedAt: Date.now(),
      dateString: args.dateString,
      value: args.value,
    });

    return logId;
  },
});

/**
 * Remove a chore log entry (e.g. if accidentally checked off).
 */
export const unlogTask = mutation({
  args: {
    logId: v.id("taskLogs"),
  },
  handler: async (ctx: MutationCtx, args: { logId: Id<"taskLogs"> }) => {
    await ctx.db.delete(args.logId);
    return { success: true };
  },
});

/**
 * Fetch today's completed logs for a cat with roommate names.
 */
export const getDailyLogs = query({
  args: { catId: v.id("cats"), dateString: v.string() },
  handler: async (
    ctx: QueryCtx,
    args: { catId: Id<"cats">; dateString: string }
  ) => {
    const rawLogs = await ctx.db
      .query("taskLogs")
      .withIndex("by_cat_and_date", (q) =>
        q.eq("catId", args.catId).eq("dateString", args.dateString)
      )
      .collect();

    // Enrich logs with user details and task title.
    // Note: log.userId is Id<"users"> and log.taskId is Id<"tasks">, so
    // ctx.db.get() returns the correct narrowed type — no `any` needed.
    const enrichedLogs = await Promise.all(
      rawLogs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        const task = await ctx.db.get(log.taskId);
        return {
          ...log,
          userName: user?.name || "Roommate",
          taskTitle: task?.title || "Daily Routine",
        };
      })
    );

    return enrichedLogs;
  },
});

/**
 * Fetch the live scrolling activity feed for the household.
 */
export const getRecentHouseholdActivity = query({
  args: {
    householdId: v.optional(v.id("households")),
  },
  handler: async (ctx: QueryCtx, args: { householdId?: Id<"households"> }) => {
    if (!args.householdId) return [];

    // Find all cats in this household
    const cats = await ctx.db
      .query("cats")
      .withIndex("by_household", (q) =>
        q.eq("householdId", args.householdId!)
      )
      .collect();

    if (cats.length === 0) return [];

    const catMap = new Map(cats.map((c) => [c._id.toString(), c.name]));

    // Pull recent logs per cat (up to 25 across the household) instead of
    // scanning the global taskLogs table.
    const perCatLogs = await Promise.all(
      cats.map((cat) =>
        ctx.db
          .query("taskLogs")
          .withIndex("by_cat_and_date", (q) => q.eq("catId", cat._id))
          .order("desc")
          .take(25)
      )
    );

    const householdLogs = perCatLogs
      .flat()
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 25);

    // Enrich with user and task info
    const enriched = await Promise.all(
      householdLogs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        const task = await ctx.db.get(log.taskId);
        return {
          _id: log._id,
          completedAt: log.completedAt,
          catName: catMap.get(log.catId.toString()) || "Cat",
          taskTitle: task?.title || "Daily Chore",
          userName: user?.name || "Roommate",
        };
      })
    );

    return enriched;
  },
});

/**
 * Aggregated query for the main dashboard:
 * Fetches all cats in the household, their daily tasks, today's completed logs,
 * and calculates the exact completion percentage for each cat.
 */
export const getDashboardData = query({
  args: {
    householdId: v.optional(v.id("households")),
    dateString: v.string(), // "YYYY-MM-DD"
  },
  handler: async (
    ctx: QueryCtx,
    args: { householdId?: Id<"households">; dateString: string }
  ) => {
    if (!args.householdId) return null;

    const household = await ctx.db.get(args.householdId);
    if (!household) return null;

    // 1. Fetch cats for this household
    const cats = await ctx.db
      .query("cats")
      .withIndex("by_household", (q) =>
        q.eq("householdId", args.householdId!)
      )
      .collect();

    // 2. For each cat, fetch tasks and today's logs
    const catsData = await Promise.all(
      cats.map(async (cat) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_cat", (q) => q.eq("catId", cat._id))
          .collect();

        const rawLogs = await ctx.db
          .query("taskLogs")
          .withIndex("by_cat_and_date", (q) =>
            q.eq("catId", cat._id).eq("dateString", args.dateString)
          )
          .collect();

        // Enrich logs with user names
        const enrichedLogs = await Promise.all(
          rawLogs.map(async (log) => {
            const user = await ctx.db.get(log.userId);
            return {
              ...log,
              userName: user?.name || "Roommate",
            };
          })
        );

        // Calculate total required chore count
        const totalFrequency = tasks.reduce(
          (acc, t) => acc + Math.max(1, t.frequency || 1),
          0
        );

        // Calculate completed count
        const completedCount = rawLogs.length;

        // Completion percentage (0 to 100)
        const completionPercentage =
          totalFrequency > 0
            ? Math.min(100, Math.round((completedCount / totalFrequency) * 100))
            : 0;

        // Map task items with completion status
        const tasksWithStatus = tasks.map((task) => {
          const taskLogs = enrichedLogs.filter(
            (l) => l.taskId.toString() === task._id.toString()
          );
          const isDone = taskLogs.length >= (task.frequency || 1);
          const lastLog = taskLogs[taskLogs.length - 1];

          return {
            ...task,
            completedCount: taskLogs.length,
            isDone,
            lastLoggedBy: lastLog?.userName,
            lastLoggedAt: lastLog?.completedAt,
            logs: taskLogs,
          };
        });

        return {
          ...cat,
          tasks: tasksWithStatus,
          totalFrequency,
          completedCount,
          completionPercentage,
          todayLogs: enrichedLogs,
        };
      })
    );

    return {
      household,
      cats: catsData,
    };
  },
});