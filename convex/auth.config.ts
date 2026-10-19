// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://heroic-penguin-7740.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
