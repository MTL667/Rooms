import NextAuth from "next-auth";
import AzureAD from "next-auth/providers/azure-ad";
import { prisma } from "@/lib/prisma";

const providers = [
  AzureAD({
    clientId: process.env.AZURE_CLIENT_ID!,
    clientSecret: process.env.AZURE_CLIENT_SECRET!,
    authorization: {
      params: {
        tenant: process.env.AZURE_TENANT_ID!,
      },
    },
  }),
];

// Only add Email provider if EMAIL_SERVER is configured
if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  const Email = require("next-auth/providers/email").default;
  providers.push(
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

const authOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }: any) {
      try {
        if (account?.provider === "azure-ad" && profile?.tid) {
          const tenant = await prisma.allowedTenant.findFirst({
            where: { tenantId: profile.tid, active: true },
          });

          if (!tenant) {
            console.log(`Tenant ${profile.tid} not allowed`);
            return false;
          }

          await prisma.user.upsert({
            where: { email: user.email! },
            create: {
              email: user.email!,
              name: user.name || null,
              identityProvider: "MICROSOFT",
              msTenantId: profile.tid,
              msOid: profile.oid || null,
              status: "ACTIVE",
              role: "EXTERNAL",
            },
            update: { name: user.name || null, msOid: profile.oid || null, status: "ACTIVE" },
          });
        } else if (account?.provider === "email") {
          const userRecord = await prisma.user.findUnique({ where: { email: user.email! } });
          if (!userRecord || userRecord.status !== "ACTIVE") return false;
        }
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },
    async session({ session }: any) {
      if (session.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) {
          session.user.role = user.role;
          session.user.id = user.id;
          session.user.identityProvider = user.identityProvider;
        }
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
};

export const { handlers } = NextAuth(authOptions);
export const { GET, POST } = handlers;
