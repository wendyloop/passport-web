import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLoadingCard } from "@/components/portal/PortalFrame";
import { PortalGuard } from "@/components/portal/PortalGuard";
import { getTalentHome } from "@/lib/talent-data";

export const Route = createFileRoute("/talent/")({
  component: TalentIndexRoute,
});

function TalentIndexRoute() {
  return (
    <PortalGuard allowedRoles={["admin", "employer"]}>
      <TalentIndexRedirect />
    </PortalGuard>
  );
}

function TalentIndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: getTalentHome(), replace: true });
  }, [navigate]);

  return <PortalLoadingCard label="Opening Talent GPT…" />;
}
