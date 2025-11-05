import { Role, IdentityProvider } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: Role;
    identityProvider?: IdentityProvider;
    msTenantId?: string | null;
  }
  
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: Role;
      identityProvider?: IdentityProvider;
      msTenantId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    identityProvider?: IdentityProvider;
  }
}
