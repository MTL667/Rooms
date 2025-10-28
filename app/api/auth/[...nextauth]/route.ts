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
          // Check if tenant exists, if not create it
          let tenant = await prisma.allowedTenant.findFirst({
            where: { tenantId: profile.tid },
          });

          if (!tenant) {
            // Create tenant automatically
            tenant = await prisma.allowedTenant.create({
              data: {
                tenantId: profile.tid,
                name: 'Auto-created tenant',
                active: true,
              },
            });
          }

          // Check if this is the first user in the tenant
          const existingUsers = await prisma.user.count({
            where: { msTenantId: profile.tid },
          });

          const userRole = existingUsers === 0 ? 'ADMIN' : 'EXTERNAL';

          // Create or update user
          await prisma.user.upsert({
            where: { email: user.email! },
            create: {
              email: user.email!,
              name: user.name || null,
              identityProvider: "MICROSOFT",
              msTenantId: profile.tid,
              msOid: profile.oid || null,
              status: "ACTIVE",
              role: userRole, // First user becomes ADMIN
            },
            update: { 
              name: user.name || null, 
              msOid: profile.oid || null, 
              status: "ACTIVE",
            },
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
    async redirect({ url, baseUrl }: any) {
      // After successful login, redirect to dashboard
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: { signIn: "/auth/signin" },
};

export const { handlers } = NextAuth(authOptions);
export const { GET, POST } = handlers;
