import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Add a single cat to a household.
 */
export const createCat = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    photoUrl: v.optional(v.string()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      householdId: Id<"households">;
      name: string;
      photoUrl?: string;
    }
  ) => {
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Cat name is required");

    const catId = await ctx.db.insert("cats", {
      householdId: args.householdId,
      name: trimmed,
      photoUrl: args.photoUrl,
    });

    return catId;
  },
});

/**
 * Update a cat's name and/or photo.
 */
export const updateCat = mutation({
  args: {
    catId: v.id("cats"),
    name: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    clearPhoto: v.optional(v.boolean()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      catId: Id<"cats">;
      name?: string;
      photoUrl?: string;
      clearPhoto?: boolean;
    }
  ) => {
    const cat = await ctx.db.get(args.catId);
    if (!cat) throw new Error("Cat not found");

    const patch: Record<string, any> = {};

    if (args.name !== undefined) {
      const trimmed = args.name.trim();
      if (!trimmed) throw new Error("Cat name cannot be empty");
      patch.name = trimmed;
    }

    if (args.clearPhoto) {
      patch.photoUrl = undefined;
    } else if (args.photoUrl !== undefined) {
      patch.photoUrl = args.photoUrl;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.catId, patch);
    }

    return { success: true };
  },
});

/**
 * Delete a cat along with its tasks and today's/all logs.
 */
export const deleteCat = mutation({
  args: { catId: v.id("cats") },
  handler: async (ctx: MutationCtx, args: { catId: Id<"cats"> }) => {
    const cat = await ctx.db.get(args.catId);
    if (!cat) throw new Error("Cat not found");

    // Delete all tasks for this cat
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_cat", (q) => q.eq("catId", args.catId))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete all taskLogs for this cat
    const logs = await ctx.db
      .query("taskLogs")
      .withIndex("by_cat_and_date", (q) => q.eq("catId", args.catId))
      .collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(args.catId);

    return { success: true };
  },
});

/**
 * Generate a Convex upload URL for cat photos.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Batch-create a set of cats + tasks for household setup.
 */
export const saveHouseholdSetup = mutation({
  args: {
    householdId: v.id("households"),
    cats: v.array(
      v.object({
        name: v.string(),
        photoUrl: v.optional(v.string()),
        photoStorageId: v.optional(v.string()),
        tasks: v.array(
          v.object({
            title: v.string(),
            type: v.string(),
            frequency: v.number(),
            config: v.optional(v.any()),
          })
        ),
      })
    ),
  },
  handler: async (ctx: MutationCtx, args: any) => {
    const results = [];

    for (const cat of args.cats) {
      let resolvedPhotoUrl = cat.photoUrl;

      if (cat.photoStorageId) {
        resolvedPhotoUrl = (await ctx.storage.getUrl(cat.photoStorageId)) || cat.photoUrl;
      }

      const catId = await ctx.db.insert("cats", {
        householdId: args.householdId,
        name: cat.name.trim(),
        photoUrl: resolvedPhotoUrl,
      });

      for (const task of cat.tasks) {
        await ctx.db.insert("tasks", {
          catId,
          title: task.title.trim(),
          type: task.type || "checkbox",
          frequency: Math.max(1, task.frequency || 1),
          config: task.config,
        });
      }

      results.push({ _id: catId, name: cat.name });
    }

    return results;
  },
});