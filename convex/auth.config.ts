export default {
  providers: [
    {
      // Set this in Convex dashboard: npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://..."
      // Get it from: Clerk Dashboard → JWT Templates → convex → Issuer
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN as string,
      applicationID: "convex",
    },
  ],
};
