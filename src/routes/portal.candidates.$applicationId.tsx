import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CandidateProfileSummary } from "@/components/portal/CandidateProfileSummary";
import { CandidateVideo } from "@/components/portal/CandidateVideo";
import { EmployerActionPanel } from "@/components/portal/EmployerActionPanel";
import { PortalGuard } from "@/components/portal/PortalGuard";
import { PortalLoadingCard } from "@/components/portal/PortalFrame";
import { Card } from "@/components/ui/card";
import {
  createSignedResumeUrl,
  fetchAdminEmployerActions,
  fetchApplicationById,
  fetchEmployerActionsForCurrentEmployer,
} from "@/lib/portal-data";
import { usePortalAuth } from "@/lib/portal-auth";

export const Route = createFileRoute("/portal/candidates/$applicationId")({
  component: PortalCandidateDetailRoute,
});

function PortalCandidateDetailRoute() {
  return (
    <PortalGuard allowedRoles={["admin", "employer"]}>
      <PortalCandidateDetail />
    </PortalGuard>
  );
}

function PortalCandidateDetail() {
  const { applicationId } = Route.useParams();
  const { role, user } = usePortalAuth();
  const applicationQuery = useQuery({
    queryKey: ["portal-candidate", applicationId],
    queryFn: () => fetchApplicationById(applicationId),
  });
  const employerActionsQuery = useQuery({
    queryKey: role === "admin" ? ["portal-admin-employer-actions"] : ["portal-employer-actions"],
    queryFn: role === "admin" ? fetchAdminEmployerActions : fetchEmployerActionsForCurrentEmployer,
  });

  if (applicationQuery.isLoading || employerActionsQuery.isLoading) {
    return <PortalLoadingCard />;
  }

  if (!applicationQuery.data) {
    return <PortalLoadingCard label="Candidate not found." />;
  }

  const application = applicationQuery.data;
  const currentEmployerAction =
    role === "employer"
      ? employerActionsQuery.data?.find((action) => action.application_id === applicationId)
      : undefined;
  const adminActions =
    role === "admin"
      ? employerActionsQuery.data?.filter((action) => action.application_id === applicationId)
      : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <div className="space-y-6">
        <CandidateVideo videoPath={application.video_path} controls />
        {role === "employer" && user ? (
          <EmployerActionPanel
            applicationId={application.id}
            initialAction={currentEmployerAction}
          />
        ) : null}
      </div>

      <div className="space-y-6">
        <CandidateProfileSummary
          application={application}
          showEmail={role === "admin"}
          resumeAction={() => {
            void openResume(application.resume_path);
          }}
        />

        {role === "admin" ? (
          <Card className="border-border/60 bg-background/60 p-6 shadow-xl backdrop-blur">
            <h3 className="text-lg font-semibold tracking-tight">Employer activity</h3>
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
                        <p className="mt-1 text-xs text-muted-foreground">{action.updated_at}</p>
                      </div>
                      <span className="text-sm text-foreground">
                        {action.shortlisted ? "Shortlisted" : "Not shortlisted"}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
                      {action.notes || "No notes left yet."}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No employer activity recorded yet.</p>
              )}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

async function openResume(resumePath: string) {
  const signedUrl = await createSignedResumeUrl(resumePath);
  window.open(signedUrl, "_blank", "noopener,noreferrer");
}
