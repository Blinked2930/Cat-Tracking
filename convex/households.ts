import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Create a new household and attach the caller to it.
 */
export const createHousehold = mutation({
  args: {
    name: v.string(),
    clerkId: v.optional(v.string()),
  },
  handler: async (
    ctx: MutationCtx,
    args: { name: string; clerkId?: string }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) throw new Error("Must be signed in to create a household");

    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Household name is required");

    // Generate a 6-char invite code; retry on collision.
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let inviteCode = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      let candidate = "";
      for (let i = 0; i < 6; i++) {
        candidate += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await ctx.db
        .query("households")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", candidate))
        .unique();
      if (!existing) {
        inviteCode = candidate;
        break;
      }
    }
    if (!inviteCode) throw new Error("Could not generate invite code");

    const householdId = await ctx.db.insert("households", {
      name: trimmed,
      inviteCode,
    });

    // Attach the caller.
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { householdId });
    } else {
      await ctx.db.insert("users", {
        clerkId,
        name: "Roommate",
        householdId,
      });
    }

    return { householdId, name: trimmed, inviteCode };
  },
});

/**
 * Join an existing household by invite code.
 */
export const joinHousehold = mutation({
  args: {
    inviteCode: v.string(),
    clerkId: v.optional(v.string()),
  },
  handler: async (
    ctx: MutationCtx,
    args: { inviteCode: string; clerkId?: string }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) throw new Error("Must be signed in to join a household");

    const cleanCode = args.inviteCode.trim().toUpperCase();
    const household = await ctx.db
      .query("households")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", cleanCode))
      .unique();

    if (!household) throw new Error("No household found with that code");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { householdId: household._id });
    } else {
      await ctx.db.insert("users", {
        clerkId,
        name: "Roommate",
        householdId: household._id,
      });
    }

    return { _id: household._id, name: household.name, inviteCode: household.inviteCode };
  },
});

/**
 * Leave the current household. Clears the user's householdId.
 * Households and their cats/tasks/logs are left intact (the other members
 * still need them). If you want to delete an empty household, that belongs
 * in a separate "delete household" flow.
 */
export const leaveHousehold = mutation({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { clerkId?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) throw new Error("Must be signed in to leave a household");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) throw new Error("User record not found");

    await ctx.db.patch(user._id, { householdId: undefined });

    return { success: true };
  },
});

/**
 * Get a household by ID (used by the setup view).
 */
export const getById = query({
  args: { householdId: v.id("households") },
  handler: async (ctx: QueryCtx, args: { householdId: Id<"households"> }) => {
    return await ctx.db.get(args.householdId);
  },
});