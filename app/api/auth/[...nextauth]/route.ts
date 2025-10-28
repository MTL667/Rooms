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
          console.log('Processing Azure AD login for:', user.email, 'Tenant:', profile.tid);
          
          try {
            // Find or create tenant
            let tenant = await prisma.allowedTenant.findFirst({
              where: { tenantId: profile.tid },
            });

            if (!tenant) {
              console.log('Creating new tenant:', profile.tid);
              tenant = await prisma.allowedTenant.create({
                data: {
                  tenantId: profile.tid,
                  name: 'Auto-created tenant',
                  active: true,
                },
              });
            }

            // Check if this tenant already has ANY users
            const existingUsers = await prisma.user.findMany({
              where: { msTenantId: profile.tid },
            });

            console.log('Existing users for tenant:', existingUsers.length);

            // First user becomes admin, others become external
            const userRole = existingUsers.length === 0 ? 'ADMIN' : 'EXTERNAL';
            console.log('Setting role for', user.email, 'to', userRole);

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email! },
            });

            if (existingUser) {
              // Update existing user
              await prisma.user.update({
                where: { email: user.email! },
                data: { 
                  name: user.name || null, 
                  msOid: profile.oid || null, 
                  status: "ACTIVE",
                },
              });
              console.log('Updated existing user');
            } else {
              // Create new user
              await prisma.user.create({
                data: {
                  email: user.email!,
                  name: user.name || null,
                  identityProvider: "MICROSOFT",
                  msTenantId: profile.tid,
                  msOid: profile.oid || null,
                  status: "ACTIVE",
                  role: userRole,
                },
              });
              console.log('Created new user with role:', userRole);
            }
          } catch (dbError) {
            console.error("Database error in signIn:", dbError);
          }
        }
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return true;
      }
    },
    async session({ session, token }: any) {
      try {
        if (token?.email) {
          const user = await prisma.user.findUnique({ where: { email: token.email } });
          if (user) {
            console.log('Session for user:', user.email, 'Role:', user.role);
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
