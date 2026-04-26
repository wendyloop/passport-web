import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLoadingCard } from "@/components/portal/PortalFrame";
import { getPortalHome } from "@/lib/portal-data";
import { usePortalAuth } from "@/lib/portal-auth";

export const Route = createFileRoute("/portal/")({
  component: PortalIndexRoute,
});

function PortalIndexRoute() {
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

    if (role) {
      void navigate({ to: getPortalHome(role), replace: true });
    }
  }, [loading, navigate, role, session]);

  return <PortalLoadingCard label="Opening portal…" />;
}
