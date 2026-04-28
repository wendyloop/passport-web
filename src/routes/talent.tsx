import { Outlet, createFileRoute } from "@tanstack/react-router";
import { TalentFrame } from "@/components/talent/TalentFrame";

export const Route = createFileRoute("/talent")({
  head: () => ({
    meta: [{ title: "Talent GPT" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: TalentRoute,
});

function TalentRoute() {
  return (
    <TalentFrame
      title="Private PeopleGPT workspace"
      subtitle="Search, ingest, and manage your private resume graph without exposing this system anywhere on the public application flow."
    >
      <Outlet />
    </TalentFrame>
  );
}
