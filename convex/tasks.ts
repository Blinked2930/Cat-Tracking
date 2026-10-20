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
 * Record a chore completion event by a roommate. Snapshots the user's current
 * display name so later renames don't rewrite historical logs.
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      throw new Error("User record not found. Sync user first.");
    }

    const logId = await ctx.db.insert("taskLogs", {
      taskId: args.taskId,
      catId: args.catId,
      userId: user._id,
      userNameSnapshot: user.name,
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
 * Fetch today's completed logs for a cat with roommate names. Prefers the
 * snapshot taken at log-time over the user's current name.
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

    const enrichedLogs = await Promise.all(
      rawLogs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        const task = await ctx.db.get(log.taskId);
        return {
          ...log,
          userName: log.userNameSnapshot || user?.name || "Roommate",
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

    const cats = await ctx.db
      .query("cats")
      .withIndex("by_household", (q) =>
        q.eq("householdId", args.householdId!)
      )
      .collect();

    if (cats.length === 0) return [];

    const catMap = new Map(cats.map((c) => [c._id.toString(), c.name]));

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

    const enriched = await Promise.all(
      householdLogs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        const task = await ctx.db.get(log.taskId);
        return {
          _id: log._id,
          completedAt: log.completedAt,
          catName: catMap.get(log.catId.toString()) || "Cat",
          taskTitle: task?.title || "Daily Chore",
          userName: log.userNameSnapshot || user?.name || "Roommate",
        };
      })
    );

    return enriched;
  },
});

/**
 * Aggregated query for the main dashboard.
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

    const cats = await ctx.db
      .query("cats")
      .withIndex("by_household", (q) =>
        q.eq("householdId", args.householdId!)
      )
      .collect();

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

        const enrichedLogs = await Promise.all(
          rawLogs.map(async (log) => {
            const user = await ctx.db.get(log.userId);
            return {
              ...log,
              userName: log.userNameSnapshot || user?.name || "Roommate",
            };
          })
        );

        const totalFrequency = tasks.reduce(
          (acc, t) => acc + Math.max(1, t.frequency || 1),
          0
        );

        const completedCount = rawLogs.length;

        const completionPercentage =
          totalFrequency > 0
            ? Math.min(100, Math.round((completedCount / totalFrequency) * 100))
            : 0;

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