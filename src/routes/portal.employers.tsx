/*
 * Paused hidden workspace.
 * Preserved for future reuse, but currently unregistered while the product is
 * focused on the public referral experience.
 */
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CandidateVideo } from "@/components/portal/CandidateVideo";
import { EmployerActionPanel } from "@/components/portal/EmployerActionPanel";
import { PortalGuard } from "@/components/portal/PortalGuard";
import { PortalLoadingCard } from "@/components/portal/PortalFrame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createSignedResumeUrl,
  type EmployerCandidateAction,
  fetchApplications,
  fetchEmployerActionsForCurrentEmployer,
} from "@/lib/portal-data";
import { usePortalAuth } from "@/lib/portal-auth";

export const Route = createFileRoute("/portal/employers")({
  component: PortalEmployersRoute,
});

function PortalEmployersRoute() {
  return (
    <PortalGuard allowedRoles={["employer"]}>
      <PortalEmployerWorkspace />
    </PortalGuard>
  );
}

function PortalEmployerWorkspace() {
  const { user, roleRecord } = usePortalAuth();
  const applicationsQuery = useQuery({
    queryKey: ["portal-applications"],
    queryFn: fetchApplications,
  });
  const actionsQuery = useQuery({
    queryKey: ["portal-employer-actions"],
    queryFn: fetchEmployerActionsForCurrentEmployer,
  });

  const actionsByApplication = useMemo(() => {
    const map = new Map<string, EmployerCandidateAction>();
    for (const action of actionsQuery.data ?? []) {
      map.set(action.application_id, action);
    }
    return map;
  }, [actionsQuery.data]);

  if (applicationsQuery.isLoading || actionsQuery.isLoading) {
    return <PortalLoadingCard />;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-background/60 p-5 shadow-xl backdrop-blur">
        <h2 className="text-xl font-semibold tracking-tight">
          Candidate feed{roleRecord?.company_name ? ` · ${roleRecord.company_name}` : ""}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Scroll through candidates, watch their intro videos, shortlist promising profiles, and
          keep internal notes for your team.
        </p>
      </Card>

      <div className="h-[calc(100vh-15rem)] snap-y snap-mandatory space-y-6 overflow-y-auto pr-1">
        {(applicationsQuery.data ?? []).map((application) => (
          <Card
            key={application.id}
            className="snap-start border-border/60 bg-background/55 p-6 shadow-2xl backdrop-blur"
          >
            <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-4">
                <CandidateVideo videoPath={application.video_path} autoplay />
                <div className="flex flex-wrap gap-2">
                  <Badge>{application.status}</Badge>
                  <Badge variant="secondary">{application.resume_parse_status}</Badge>
                  {application.interview_categories.map((category) => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">{application.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {application.most_recent_role || "Most recent role unavailable"}
                  </p>
                </div>

                <MetadataBlock
                  label="Schools"
                  value={application.schools.join(", ") || "None parsed"}
                />
                <MetadataBlock
                  label="Companies"
                  value={application.companies.join(", ") || "None parsed"}
                />
                <MetadataBlock
                  label="Interview details"
                  value={application.interview_details || "No extra interview details provided."}
                />

                {application.linkedin ? (
                  <a
                    href={normalizeUrl(application.linkedin)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm text-primary underline-offset-4 hover:underline"
                  >
                    View LinkedIn
                  </a>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link
                      to="/portal/candidates/$applicationId"
                      params={{ applicationId: application.id }}
                    >
                      Open full profile
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void openResume(application.resume_path);
                    }}
                  >
                    Open resume
                  </Button>
                </div>

                {user ? (
                  <EmployerActionPanel
                    applicationId={application.id}
                    initialAction={actionsByApplication.get(application.id)}
                  />
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MetadataBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{value}</p>
    </div>
  );
}

function normalizeUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

async function openResume(resumePath: string) {
  const signedUrl = await createSignedResumeUrl(resumePath);
  window.open(signedUrl, "_blank", "noopener,noreferrer");
}
