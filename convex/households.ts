import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Character set for punchy, easy-to-read 6-character invite codes (omitting ambiguous 0, O, 1, I)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

/**
 * Create a new household ("Squat") with a unique 6-character invite code
 * and automatically associate the creating user with this household.
 */
export const createHousehold = mutation({
  args: {
    name: v.string(),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { name: string; clerkId?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) {
      throw new Error("Unauthorized: You must be logged in to start a squat");
    }

    const trimmedName = args.name.trim();
    if (!trimmedName) {
      throw new Error("Squat name cannot be empty");
    }

    // Find the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      throw new Error("User record not found. Please sync user first.");
    }

    // Generate a unique 6-character invite code
    let inviteCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      inviteCode = generateInviteCode();
      const existing = await ctx.db
        .query("households")
        .withIndex("by_invite_code", (q: any) => q.eq("inviteCode", inviteCode))
        .unique();
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error("Could not generate a unique invite code. Try again.");
    }

    // Insert new household
    const householdId = await ctx.db.insert("households", {
      name: trimmedName,
      inviteCode,
    });

    // Link user to the new household
    await ctx.db.patch(user._id, {
      householdId,
    });

    return {
      householdId,
      name: trimmedName,
      inviteCode,
    };
  },
});

/**
 * Join an existing household ("Join the Crew") using a 6-character invite code.
 */
export const joinHousehold = mutation({
  args: {
    inviteCode: v.string(),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { inviteCode: string; clerkId?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) {
      throw new Error("Unauthorized: You must be logged in to join a crew");
    }

    const cleanCode = args.inviteCode.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      throw new Error("Invite code must be exactly 6 characters");
    }

    // Find the household by invite code
    const household = await ctx.db
      .query("households")
      .withIndex("by_invite_code", (q: any) => q.eq("inviteCode", cleanCode))
      .unique();

    if (!household) {
      throw new Error(`Crew not found! Code "${cleanCode}" does not match any squat.`);
    }

    // Find user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      throw new Error("User record not found. Please sync user first.");
    }

    // Associate user with household
    await ctx.db.patch(user._id, {
      householdId: household._id,
    });

    return {
      householdId: household._id,
      name: household.name,
      inviteCode: household.inviteCode,
    };
  },
});

/**
 * Query current household details including crew members and cats.
 */
export const getHouseholdDetails = query({
  args: {
    householdId: v.optional(v.id("households")),
  },
  handler: async (ctx: QueryCtx, args: { householdId?: Id<"households"> }) => {
    if (!args.householdId) {
      return null;
    }

    const household = await ctx.db.get(args.householdId);
    if (!household) {
      return null;
    }

    // Fetch crew members in this household
    const members = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("householdId"), args.householdId))
      .collect();

    // Fetch cats in this household
    const cats = await ctx.db
      .query("cats")
      .withIndex("by_household", (q: any) => q.eq("householdId", args.householdId!))
      .collect();

    return {
      ...household,
      members,
      cats,
    };
  },
});

/**
 * Leave current household (useful for switching households or resetting in dev).
 */
export const leaveHousehold = mutation({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args: { clerkId?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        householdId: undefined,
      });
    }

    return { success: true };
  },
});
