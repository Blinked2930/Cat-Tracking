"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Create Convex client instance (fallback URL prevents crashing before `npx convex dev` is run)
const convex = new ConvexReactClient(convexUrl || "https://placeholder-cat-tracker.convex.cloud");

/**
 * ConvexClientProvider
 * Wraps ClerkProvider and ConvexProviderWithClerk so all child components
 * have real-time access to Convex queries and Clerk authentication state.
 */
export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Graceful fallback before Clerk API keys are added in .env.local
  if (!clerkPubKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
