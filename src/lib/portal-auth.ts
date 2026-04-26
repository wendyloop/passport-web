import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type PortalRole = "admin" | "employer";

export type PortalProfile = {
  id: string;
  email: string;
  full_name: string | null;
};

export type PortalRoleRecord = {
  role: PortalRole;
  company_name: string | null;
};

export type PortalAuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: PortalProfile | null;
  roleRecord: PortalRoleRecord | null;
  role: PortalRole | null;
  requestMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);

  if (!context) {
    throw new Error("usePortalAuth must be used within a PortalAuthProvider.");
  }

  return context;
}
