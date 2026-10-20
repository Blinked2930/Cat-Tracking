import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
  args: {
    clerkId: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (
    ctx: MutationCtx,
    args: { clerkId?: string; name?: string }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) {
      throw new Error("Cannot sync user: No Clerk ID found");
    }

    const candidateName =
      args.name ||
      identity?.name ||
      identity?.nickname ||
      identity?.givenName ||
      "";

    const cleanName = candidateName.trim() || "Roommate";

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();

    if (existingUser) {
      // Only upgrade away from the "Roommate" fallback. Never overwrite a
      // name the user has explicitly set.
      const shouldUpgradeName =
        existingUser.name === "Roommate" && cleanName !== "Roommate";

      if (shouldUpgradeName) {
        const currentSaved = existingUser.savedNames ?? [];
        const nextSaved = currentSaved.includes(cleanName)
          ? currentSaved
          : [...currentSaved, cleanName];
        await ctx.db.patch(existingUser._id, {
          name: cleanName,
          savedNames: nextSaved,
        });
        return {
          _id: existingUser._id,
          clerkId: existingUser.clerkId,
          name: cleanName,
          savedNames: nextSaved,
          householdId: existingUser.householdId,
        };
      }

      return {
        _id: existingUser._id,
        clerkId: existingUser.clerkId,
        name: existingUser.name,
        savedNames: existingUser.savedNames ?? [],
        householdId: existingUser.householdId,
      };
    }

    const newUserId = await ctx.db.insert("users", {
      clerkId,
      name: cleanName,
      savedNames: cleanName === "Roommate" ? [] : [cleanName],
    });

    return {
      _id: newUserId,
      clerkId,
      name: cleanName,
      savedNames: cleanName === "Roommate" ? [] : [cleanName],
      householdId: undefined,
    };
  },
});

export const currentUser = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { clerkId?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) return null;

    let household = null;
    if (user.householdId) {
      household = await ctx.db.get(user.householdId);
    }

    return {
      ...user,
      savedNames: user.savedNames ?? [],
      household,
    };
  },
});

/**
 * Switch active display name to an existing saved name.
 */
export const setActiveName = mutation({
  args: {
    clerkId: v.optional(v.string()),
    name: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { clerkId?: string; name: string }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;
    if (!clerkId) throw new Error("Not authenticated");

    const clean = args.name.trim();
    if (!clean) throw new Error("Name cannot be empty");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) throw new Error("User record not found");

    const saved = user.savedNames ?? [];
    if (!saved.includes(clean)) {
      throw new Error("That name isn't in your saved list");
    }

    await ctx.db.patch(user._id, { name: clean });
    return { success: true, name: clean };
  },
});

/**
 * Add a new name to the saved list and make it the active name.
 */
export const addSavedName = mutation({
  args: {
    clerkId: v.optional(v.string()),
    name: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { clerkId?: string; name: string }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;
    if (!clerkId) throw new Error("Not authenticated");

    const clean = args.name.trim();
    if (!clean) throw new Error("Name cannot be empty");
    if (clean.length > 40) throw new Error("Name is too long");
    if (clean === "Roommate") throw new Error("Pick a different name");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) throw new Error("User record not found");

    const saved = user.savedNames ?? [];
    const nextSaved = saved.includes(clean) ? saved : [...saved, clean];

    await ctx.db.patch(user._id, {
      name: clean,
      savedNames: nextSaved,
    });
    return { success: true, name: clean, savedNames: nextSaved };
  },
});

/**
 * Remove a name from the saved list. Cannot remove the currently active name
 * or the last remaining name.
 */
export const removeSavedName = mutation({
  args: {
    clerkId: v.optional(v.string()),
    name: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { clerkId?: string; name: string }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;
    if (!clerkId) throw new Error("Not authenticated");

    const clean = args.name.trim();
    if (!clean) throw new Error("Name cannot be empty");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) throw new Error("User record not found");

    const saved = user.savedNames ?? [];
    if (!saved.includes(clean)) {
      throw new Error("That name isn't saved");
    }
    if (clean === user.name) {
      throw new Error("Switch to a different name before removing this one");
    }
    const remaining = saved.filter((n) => n !== clean);
    if (remaining.length === 0) {
      throw new Error("Keep at least one name");
    }

    await ctx.db.patch(user._id, { savedNames: remaining });
    return { success: true, savedNames: remaining };
  },
});