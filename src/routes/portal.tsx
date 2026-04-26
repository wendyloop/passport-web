import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PortalFrame } from "@/components/portal/PortalFrame";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [{ title: "Portal" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: PortalRoute,
});

function PortalRoute() {
  return (
    <PortalFrame
      title="Private workspace"
      subtitle="Internal admin and employer review tools live here. This area is hidden from the public candidate application flow."
    >
      <Outlet />
    </PortalFrame>
  );
}
