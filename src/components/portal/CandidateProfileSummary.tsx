import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ApplicationRecord } from "@/lib/portal-data";

export function CandidateProfileSummary({
  application,
  showEmail = false,
  resumeAction,
}: {
  application: ApplicationRecord;
  showEmail?: boolean;
  resumeAction?: () => void;
}) {
  return (
    <Card className="border-border/60 bg-background/60 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{application.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge label={application.status} variant="default" />
            <StatusBadge
              label={`Resume parse: ${application.resume_parse_status}`}
              variant={application.resume_parse_status === "failed" ? "destructive" : "secondary"}
            />
          </div>
        </div>
        {resumeAction ? (
          <Button variant="outline" onClick={resumeAction}>
            Open resume
          </Button>
        ) : null}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {showEmail ? <ProfileItem label="Email" value={application.email} /> : null}
        {application.linkedin ? (
          <ProfileItem
            label="LinkedIn"
            value={
              <a
                href={normalizeUrl(application.linkedin)}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {application.linkedin}
              </a>
            }
          />
        ) : null}
        <ProfileItem label="Most recent role" value={application.most_recent_role ?? "Unknown"} />
        <ProfileItem
          label="Interview categories"
          value={
            application.interview_categories.length
              ? application.interview_categories.join(", ")
              : "None"
          }
        />
        <ProfileItem
          label="Schools"
          value={application.schools.length ? application.schools.join(", ") : "None parsed"}
        />
        <ProfileItem
          label="Companies"
          value={application.companies.length ? application.companies.join(", ") : "None parsed"}
        />
      </dl>

      <div className="mt-6">
        <p className="text-sm font-medium text-muted-foreground">Interview details</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
          {application.interview_details || "No extra interview details provided."}
        </p>
      </div>
    </Card>
  );
}

function ProfileItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "default" | "secondary" | "destructive";
}) {
  return <Badge variant={variant}>{label}</Badge>;
}

function normalizeUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}
