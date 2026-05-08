/*
 * Paused hidden workspace.
 * The product shifted to the public referral site, so /talent routes are
 * intentionally unregistered from the active route tree for now.
 * Keep this file for future reuse if the app returns to PeopleGPT-style tooling.
 */
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
