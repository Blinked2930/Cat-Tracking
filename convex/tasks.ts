import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const createTask = mutation({
  args: {
    catId: v.id("cats"),
    title: v.string(),
    type: v.string(),
    frequency: v.number(),
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

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
    frequency: v.optional(v.number()),
    config: v.optional(v.any()),
    clearConfig: v.optional(v.boolean()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      taskId: Id<"tasks">;
      title?: string;
      type?: string;
      frequency?: number;
      config?: any;
      clearConfig?: boolean;
    }
  ) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const patch: Record<string, any> = {};

    if (args.title !== undefined) {
      const trimmed = args.title.trim();
      if (!trimmed) throw new Error("Task title cannot be empty");
      patch.title = trimmed;
    }

    if (args.type !== undefined) {
      patch.type = args.type;
      // Checkboxes are always frequency 1
      if (args.type === "checkbox") {
        patch.frequency = 1;
      }
    }

    if (args.frequency !== undefined && patch.type !== "checkbox") {
      patch.frequency = Math.max(1, args.frequency);
    }

    if (args.clearConfig) {
      patch.config = undefined;
    } else if (args.config !== undefined) {
      patch.config = args.config;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.taskId, patch);
    }

    return { success: true };
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx: MutationCtx, args: { taskId: Id<"tasks"> }) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Delete logs for this task first (no direct index, so scan by task_and_date)
    const logs = await ctx.db
      .query("taskLogs")
      .withIndex("by_task_and_date", (q) => q.eq("taskId", args.taskId))
      .collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(args.taskId);
    return { success: true };
  },
});

export const getByCat = query({
  args: { catId: v.id("cats") },
  handler: async (ctx: QueryCtx, args: { catId: Id<"cats"> }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_cat", (q) => q.eq("catId", args.catId))
      .collect();
  },
});

export const logTask = mutation({
  args: {
    taskId: v.id("tasks"),
    catId: v.id("cats"),
    dateString: v.string(),
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

    if (!clerkId) throw new Error("Must be logged in to log tasks");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) throw new Error("User record not found. Sync user first.");

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

export const unlogTask = mutation({
  args: { logId: v.id("taskLogs") },
  handler: async (ctx: MutationCtx, args: { logId: Id<"taskLogs"> }) => {
    await ctx.db.delete(args.logId);
    return { success: true };
  },
});

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

    return await Promise.all(
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
  },
});

export const getRecentHouseholdActivity = query({
  args: { householdId: v.optional(v.id("households")) },
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

    return await Promise.all(
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
  },
});

export const getDashboardData = query({
  args: {
    householdId: v.optional(v.id("households")),
    dateString: v.string(),
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

    return { household, cats: catsData };
  },
});