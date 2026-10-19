import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sync the authenticated Clerk user to the Convex `users` table.
 * Called when a user logs in / lands on the app.
 */
export const syncUser = mutation({
  args: {
    clerkId: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { clerkId?: string; name?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    
    // Resolve clerkId from JWT identity or explicit client argument
    const clerkId = identity?.subject || args.clerkId;
    if (!clerkId) {
      throw new Error("Cannot sync user: No Clerk ID found in session or args");
    }

    const name =
      args.name ||
      identity?.name ||
      identity?.nickname ||
      identity?.givenName ||
      "Anonymous Stray";

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();

    if (existingUser) {
      // Update name if changed
      if (name && existingUser.name !== name) {
        await ctx.db.patch(existingUser._id, { name });
      }
      return {
        _id: existingUser._id,
        clerkId: existingUser.clerkId,
        name: name || existingUser.name,
        householdId: existingUser.householdId,
      };
    }

    // Insert new user
    const newUserId = await ctx.db.insert("users", {
      clerkId,
      name,
    });

    return {
      _id: newUserId,
      clerkId,
      name,
      householdId: undefined,
    };
  },
});

/**
 * Fetch the current authenticated user record and their household (if joined).
 */
export const currentUser = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { clerkId?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      return null;
    }

    let household = null;
    if (user.householdId) {
      household = await ctx.db.get(user.householdId);
    }

    return {
      ...user,
      household,
    };
  },
});
