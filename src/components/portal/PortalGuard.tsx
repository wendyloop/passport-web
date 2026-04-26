import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getPortalHome } from "@/lib/portal-data";
import { type PortalRole, usePortalAuth } from "@/lib/portal-auth";
import { PortalAccessDenied, PortalLoadingCard } from "./PortalFrame";

export function PortalGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: PortalRole[];
}) {
  const navigate = useNavigate();
  const { loading, session, role } = usePortalAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!session) {
      void navigate({ to: "/portal/login", replace: true });
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      void navigate({ to: getPortalHome(role), replace: true });
    }
  }, [allowedRoles, loading, navigate, role, session]);

  if (loading) {
    return <PortalLoadingCard />;
  }

  if (!session) {
    return <PortalLoadingCard label="Redirecting to portal sign-in…" />;
  }

  if (!role) {
    return (
      <PortalAccessDenied
        title="Portal access is not enabled"
        message="This account is authenticated but does not have an assigned portal role yet."
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <PortalLoadingCard label="Redirecting to the correct workspace…" />;
  }

  return <>{children}</>;
}
