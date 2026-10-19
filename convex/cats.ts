import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Generate a short-lived upload URL for Convex file storage (cat photo).
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Add a single cat to a squat/household.
 */
export const createCat = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    photoStorageId: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    clerkId: v.optional(v.string()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      householdId: Id<"households">;
      name: string;
      photoStorageId?: string;
      photoUrl?: string;
      clerkId?: string;
    }
  ) => {
    const trimmed = args.name.trim();
    if (!trimmed) {
      throw new Error("Cat name cannot be empty");
    }

    let finalPhotoUrl = args.photoUrl;
    if (args.photoStorageId) {
      finalPhotoUrl = (await ctx.storage.getUrl(args.photoStorageId)) || undefined;
    }

    const catId = await ctx.db.insert("cats", {
      householdId: args.householdId,
      name: trimmed,
      photoUrl: finalPhotoUrl,
    });

    return catId;
  },
});

/**
 * Atomic mutation to save the full household setup:
 * multiple cats, each with their configured daily tasks and optional uploaded photos.
 */
export const saveHouseholdSetup = mutation({
  args: {
    householdId: v.id("households"),
    cats: v.array(
      v.object({
        name: v.string(),
        photoStorageId: v.optional(v.string()),
        photoUrl: v.optional(v.string()),
        tasks: v.array(
          v.object({
            title: v.string(),
            type: v.string(), // "checkbox" | "counter"
            frequency: v.number(),
            config: v.optional(v.any()),
          })
        ),
      })
    ),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      householdId: Id<"households">;
      cats: Array<{
        name: string;
        photoStorageId?: string;
        photoUrl?: string;
        tasks: Array<{
          title: string;
          type: string;
          frequency: number;
          config?: any;
        }>;
      }>;
    }
  ) => {
    if (args.cats.length === 0) {
      throw new Error("Please add at least one cat to the household setup");
    }

    const createdCatIds: Id<"cats">[] = [];

    for (const catData of args.cats) {
      const trimmedName = catData.name.trim();
      if (!trimmedName) continue;

      let photoUrl = catData.photoUrl;
      if (catData.photoStorageId) {
        photoUrl = (await ctx.storage.getUrl(catData.photoStorageId)) || undefined;
      }

      // 1. Insert Cat
      const catId = await ctx.db.insert("cats", {
        householdId: args.householdId,
        name: trimmedName,
        photoUrl,
      });

      createdCatIds.push(catId);

      // 2. Insert Tasks for this Cat
      for (const taskData of catData.tasks) {
        const trimmedTitle = taskData.title.trim();
        if (!trimmedTitle) continue;

        await ctx.db.insert("tasks", {
          catId,
          title: trimmedTitle,
          type: taskData.type || "checkbox",
          frequency: Math.max(1, taskData.frequency || 1),
          config: taskData.config,
        });
      }
    }

    return {
      success: true,
      catCount: createdCatIds.length,
      catIds: createdCatIds,
    };
  },
});

/**
 * Fetch all cats belonging to a household, including their tasks.
 */
export const getCatsByHousehold = query({
  args: {
    householdId: v.optional(v.id("households")),
  },
  handler: async (ctx: QueryCtx, args: { householdId?: Id<"households"> }) => {
    if (!args.householdId) return [];

    const cats = await ctx.db
      .query("cats")
      .withIndex("by_household", (q: any) => q.eq("householdId", args.householdId!))
      .collect();

    // Fetch tasks for each cat
    const catsWithTasks = await Promise.all(
      cats.map(async (cat: any) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_cat", (q: any) => q.eq("catId", cat._id))
          .collect();
        return {
          ...cat,
          tasks,
        };
      })
    );

    return catsWithTasks;
  },
});

/**
 * Delete a cat and their associated tasks/logs.
 */
export const removeCat = mutation({
  args: {
    catId: v.id("cats"),
  },
  handler: async (ctx: MutationCtx, args: { catId: Id<"cats"> }) => {
    // Delete associated tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_cat", (q: any) => q.eq("catId", args.catId))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete cat
    await ctx.db.delete(args.catId);
    return { success: true };
  },
});
