import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sync (or re-sync) the authenticated Clerk user to the Convex `users` table.
 * Safe to call on every page load — it's idempotent.
 */
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

    // Prefer explicit arg, then JWT claims, then fall back.
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
      // Overwrite "Roommate" fallback if we now have a real name.
      const shouldUpdateName =
        cleanName !== "Roommate" && existingUser.name !== cleanName;
      if (shouldUpdateName) {
        await ctx.db.patch(existingUser._id, { name: cleanName });
      }
      return {
        _id: existingUser._id,
        clerkId: existingUser.clerkId,
        name: shouldUpdateName ? cleanName : existingUser.name,
        householdId: existingUser.householdId,
      };
    }

    const newUserId = await ctx.db.insert("users", {
      clerkId,
      name: cleanName,
    });

    return {
      _id: newUserId,
      clerkId,
      name: cleanName,
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

    return { ...user, household };
  },
});