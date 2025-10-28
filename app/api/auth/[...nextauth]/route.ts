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

const authOptions = {
  providers,
  trustHost: true,
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      try {
        if (account?.provider === "azure-ad" && profile?.tid) {
          try {
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
          } catch (dbError) {
            console.error("Database error in signIn:", dbError);
            // Continue even if database fails - user can still sign in
          }
        }
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        // Return true to allow sign in even if callback fails
        return true;
      }
    },
    async session({ session, token }: any) {
      try {
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
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
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
