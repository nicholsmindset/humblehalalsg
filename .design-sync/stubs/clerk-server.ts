// @clerk/nextjs/server stand-in: server auth helpers reached through lib/
// modules (event-auth, admin-auth, supabase/server). Always resolves to an
// unauthenticated session in the DS rendering environment.
export async function auth() {
  return {
    userId: null,
    sessionId: null,
    orgId: null,
    getToken: async () => null,
    protect: () => {
      throw new Error("auth().protect() is unavailable outside a Next.js server runtime");
    },
  };
}

export async function currentUser() {
  return null;
}

export const clerkClient = async () => {
  throw new Error("clerkClient is unavailable outside a Next.js server runtime");
};
