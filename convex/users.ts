import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
  args: {
    clerkId: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { clerkId?: string; name?: string }) => {
    const identity = await ctx.auth.getUserIdentity();

    const clerkId = identity?.subject || args.clerkId;
    if (!clerkId) {
      throw new Error("Cannot sync user: No Clerk ID found in session or args");
    }

    const name =
      args.name ||
      identity?.name ||
      identity?.nickname ||
      identity?.givenName ||
      "Roommate";

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();

    if (existingUser) {
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