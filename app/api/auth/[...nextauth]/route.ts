import NextAuth from "next-auth";
import AzureAD from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
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
  adapter: PrismaAdapter(prisma),
  providers,
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      try {
        if (account?.provider === "azure-ad" && profile?.tid) {
          let tenant = await prisma.allowedTenant.findFirst({
            where: { tenantId: profile.tid },
          });

          if (!tenant) {
            tenant = await prisma.allowedTenant.create({
              data: {
                tenantId: profile.tid,
                name: 'Auto-created tenant',
                active: true,
              },
            });
          }

          const existingUsers = await prisma.user.count({
            where: { msTenantId: profile.tid },
          });

          const userRole = existingUsers === 0 ? 'ADMIN' : 'EXTERNAL';

          await prisma.user.upsert({
            where: { email: user.email! },
            create: {
              email: user.email!,
              name: user.name || null,
              identityProvider: "MICROSOFT",
              msTenantId: profile.tid,
              msOid: profile.oid || null,
              status: "ACTIVE",
              role: userRole,
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
    async session({ session, token }: any) {
      if (token?.email) {
        const user = await prisma.user.findUnique({ where: { email: token.email } });
        if (user) {
          session.user.role = user.role;
          session.user.id = user.id;
          session.user.identityProvider = user.identityProvider;
          session.user.email = user.email;
          session.user.name = user.name;
        }
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: { signIn: "/auth/signin" },
};

export const { handlers } = NextAuth(authOptions);
export const { GET, POST } = handlers;
