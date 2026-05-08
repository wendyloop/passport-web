/*
 * Paused hidden workspace.
 * Preserved for future reuse, but currently unregistered while the product is
 * focused on the public referral experience.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Linkedin } from "lucide-react";
import { PortalGuard } from "@/components/portal/PortalGuard";
import { TalentEmployerActionPanel } from "@/components/talent/TalentEmployerActionPanel";
import { TalentNotesPanel } from "@/components/talent/TalentNotesPanel";
import { TalentTagEditor } from "@/components/talent/TalentTagEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createSignedTalentResumeUrl,
  fetchTalentAdminEmployerActions,
  fetchTalentEmployerActionsForCurrentEmployer,
  fetchTalentProfileById,
} from "@/lib/talent-data";
import { usePortalAuth } from "@/lib/portal-auth";

export const Route = createFileRoute("/talent/candidates/$profileId")({
  component: TalentCandidateRoute,
});

function TalentCandidateRoute() {
  return (
    <PortalGuard allowedRoles={["admin", "employer"]}>
      <TalentCandidateWorkspace />
    </PortalGuard>
  );
}

function TalentCandidateWorkspace() {
  const { profileId } = Route.useParams();
  const { role, user } = usePortalAuth();
  const profileQuery = useQuery({
    queryKey: ["talent-profile", profileId],
    queryFn: () => fetchTalentProfileById(profileId),
  });
  const employerActionsQuery = useQuery({
    queryKey: role === "admin" ? ["talent-admin-employer-actions"] : ["talent-employer-actions"],
    queryFn:
      role === "admin"
        ? fetchTalentAdminEmployerActions
        : fetchTalentEmployerActionsForCurrentEmployer,
  });

  if (!profileQuery.data) {
    return (
      <Card className="border-border/60 bg-background/55 p-6 shadow-xl backdrop-blur">
        <p className="text-sm text-muted-foreground">Candidate not found.</p>
      </Card>
    );
  }

  const profile = profileQuery.data;
  const currentEmployerAction =
    role === "employer"
      ? employerActionsQuery.data?.find((action) => action.talent_profile_id === profileId)
      : undefined;
  const adminActions =
    role === "admin"
      ? employerActionsQuery.data?.filter((action) => action.talent_profile_id === profileId)
      : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <div className="space-y-6">
        <Card className="border-border/60 bg-background/55 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold tracking-tight">
                  {profile.full_name || "Unnamed candidate"}
                </h3>
                <Badge>{profile.parse_status}</Badge>
                {profile.source_page_number ? (
                  <Badge variant="secondary">Page {profile.source_page_number}</Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {profile.most_recent_role || "Most recent role unavailable"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  void openResume(profile.source_resume_path);
                }}
              >
                Open resume
              </Button>
              {profile.linkedin ? (
                <Button variant="outline" asChild>
                  <a href={normalizeUrl(profile.linkedin)} target="_blank" rel="noreferrer">
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {profile.summary ? (
            <p className="mt-5 text-sm leading-6 text-foreground/90">{profile.summary}</p>
          ) : null}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <MetadataBlock
              label="Schools"
              value={profile.schools.join(", ") || "No schools parsed"}
            />
            <MetadataBlock
              label="Companies"
              value={profile.companies.join(", ") || "No employers parsed"}
            />
            <MetadataBlock label="Email" value={profile.email || "No email parsed"} />
            <MetadataBlock
              label="Source"
              value={`${profile.source_filename}${profile.source_page_number ? ` · Page ${profile.source_page_number}` : ""}`}
            />
          </div>

          {profile.resume_text ? (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Resume text
              </p>
              <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-6 text-foreground/85">
                {profile.resume_text}
              </div>
            </div>
          ) : null}
        </Card>

        {role === "employer" && user ? (
          <TalentEmployerActionPanel profileId={profile.id} initialAction={currentEmployerAction} />
        ) : null}

        {role === "admin" ? <TalentNotesPanel profileId={profile.id} /> : null}
      </div>

      <div className="space-y-6">
        {role === "admin" ? <TalentTagEditor profileId={profile.id} /> : null}

        {role === "admin" ? (
          <Card className="border-border/60 bg-background/55 p-6 shadow-xl backdrop-blur">
            <h3 className="text-lg font-semibold tracking-tight">Employer interest</h3>
            <div className="mt-4 space-y-4">
              {adminActions?.length ? (
                adminActions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {action.profiles?.full_name ||
                            action.profiles?.email ||
                            action.employer_user_id}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(action.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={action.shortlisted ? "default" : "secondary"}>
                        {action.shortlisted ? "Shortlisted" : "Watching"}
                      </Badge>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
                      {action.notes || "No private notes left yet."}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No employer actions yet.</p>
              )}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function MetadataBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-foreground/90">{value}</p>
    </div>
  );
}

async function openResume(path: string) {
  const signedUrl = await createSignedTalentResumeUrl(path);
  window.open(signedUrl, "_blank", "noopener,noreferrer");
}

function normalizeUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}
