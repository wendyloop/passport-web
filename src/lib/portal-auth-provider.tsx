import {
  type AuthChangeEvent,
  type Session,
  type Subscription,
  type User,
} from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAppUrl } from "./basepath";
import {
  PortalAuthContext,
  type PortalAuthContextValue,
  type PortalProfile,
  type PortalRoleRecord,
} from "./portal-auth";
import { getSupabaseClient } from "./supabase";

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [roleRecord, setRoleRecord] = useState<PortalRoleRecord | null>(null);

  const loadPortalState = useCallback(async (nextSession: Session | null) => {
    const supabase = getSupabaseClient();

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setProfile(null);
      setRoleRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const [{ data: profileData, error: profileError }, { data: roleData, error: roleError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", nextSession.user.id)
          .maybeSingle(),
        supabase
          .from("portal_roles")
          .select("role, company_name")
          .eq("user_id", nextSession.user.id)
          .maybeSingle(),
      ]);

    if (profileError) {
      throw profileError;
    }

    if (roleError) {
      throw roleError;
    }

    setProfile(profileData);
    setRoleRecord(roleData);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const {
      data: { session: nextSession },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      setLoading(false);
      throw error;
    }

    await loadPortalState(nextSession);
  }, [loadPortalState]);

  useEffect(() => {
    let subscription: Subscription | null = null;

    async function initialize() {
      const supabase = getSupabaseClient();
      const {
        data: { session: nextSession },
      } = await supabase.auth.getSession();

      await loadPortalState(nextSession);

      const authSubscription = supabase.auth.onAuthStateChange(
        async (_event: AuthChangeEvent, updatedSession) => {
          await loadPortalState(updatedSession);
        },
      );

      subscription = authSubscription.data.subscription;
    }

    void initialize();

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadPortalState]);

  const requestMagicLink = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getAppUrl("/portal"),
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      loading,
      session,
      user,
      profile,
      roleRecord,
      role: roleRecord?.role ?? null,
      requestMagicLink,
      signOut,
      refresh,
    }),
    [loading, profile, refresh, requestMagicLink, roleRecord, session, signOut, user],
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}
