import type { User } from "npm:@supabase/supabase-js@2.57.4";
import { createAdminClient } from "./supabase.ts";

export type PortalRole = "admin" | "employer";

export async function requirePortalUser(request: Request, allowedRoles?: PortalRole[]) {
  const token = getBearerToken(request);
  const supabase = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw new AuthError(401, "Authentication is required.");
  }

  const { data: roleRecord, error: roleError } = await supabase
    .from("portal_roles")
    .select("role, company_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError || !roleRecord) {
    throw new AuthError(403, "Portal access is not enabled for this account.");
  }

  if (allowedRoles && !allowedRoles.includes(roleRecord.role)) {
    throw new AuthError(403, "You do not have access to this talent workspace action.");
  }

  return {
    user,
    role: roleRecord.role as PortalRole,
    companyName: roleRecord.company_name as string | null,
  };
}

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new AuthError(401, "Missing bearer token.");
  }

  return authorization.slice("Bearer ".length);
}
