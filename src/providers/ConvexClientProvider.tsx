"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to provision a deployment, then restart the dev server."
  );
}

const convex = new ConvexReactClient(convexUrl);

/**
 * ConvexClientProvider
 * Wires Convex to Clerk's auth. Must be rendered *inside* <ClerkProvider>
 * (which lives in layout.tsx) so that `useAuth` resolves to a real session.
 */
export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}