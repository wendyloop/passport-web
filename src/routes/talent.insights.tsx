import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortalGuard } from "@/components/portal/PortalGuard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fetchTalentImportJobs, fetchTalentProfiles } from "@/lib/talent-data";

export const Route = createFileRoute("/talent/insights")({
  component: TalentInsightsRoute,
});

function TalentInsightsRoute() {
  return (
    <PortalGuard allowedRoles={["admin", "employer"]}>
      <TalentInsightsWorkspace />
    </PortalGuard>
  );
}

function TalentInsightsWorkspace() {
  const profilesQuery = useQuery({
    queryKey: ["talent-profiles"],
    queryFn: fetchTalentProfiles,
  });
  const jobsQuery = useQuery({
    queryKey: ["talent-import-jobs"],
    queryFn: fetchTalentImportJobs,
  });

  const insights = useMemo(() => {
    const profiles = profilesQuery.data ?? [];
    const topSchools = collectTopValues(profiles.flatMap((profile) => profile.schools));
    const topCompanies = collectTopValues(profiles.flatMap((profile) => profile.companies));
    const topRoles = collectTopValues(
      profiles
        .map((profile) => profile.most_recent_role)
        .filter((value): value is string => Boolean(value)),
    );

    return {
      totalProfiles: profiles.length,
      completedProfiles: profiles.filter((profile) => profile.parse_status === "completed").length,
      failedProfiles: profiles.filter((profile) => profile.parse_status === "failed").length,
      combinedPdfProfiles: profiles.filter((profile) => profile.source_type === "combined_pdf_page")
        .length,
      individualProfiles: profiles.filter((profile) => profile.source_type === "individual_resume")
        .length,
      topSchools,
      topCompanies,
      topRoles,
    };
  }, [profilesQuery.data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Profiles"
          value={insights.totalProfiles}
          detail="Imported into the private graph"
        />
        <InsightCard
          label="Parsed"
          value={insights.completedProfiles}
          detail="Ready for PeopleGPT search"
        />
        <InsightCard
          label="Combined PDF pages"
          value={insights.combinedPdfProfiles}
          detail="Created from page-split imports"
        />
        <InsightCard
          label="Import jobs"
          value={(jobsQuery.data ?? []).length}
          detail="Recent batches tracked here"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <FrequencyCard title="Top schools" items={insights.topSchools} />
        <FrequencyCard title="Top employers" items={insights.topCompanies} />
        <FrequencyCard title="Top recent roles" items={insights.topRoles} />
      </div>

      <Card className="border-border/60 bg-background/55 p-6 shadow-xl backdrop-blur">
        <h3 className="text-xl font-semibold tracking-tight">Import health</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge>{insights.completedProfiles} completed</Badge>
          <Badge variant="secondary">{insights.failedProfiles} failed</Badge>
          <Badge variant="outline">{insights.individualProfiles} individual resumes</Badge>
          <Badge variant="outline">{insights.combinedPdfProfiles} combined-PDF pages</Badge>
        </div>
      </Card>
    </div>
  );
}

function InsightCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <Card className="border-border/60 bg-background/55 p-5 shadow-xl backdrop-blur">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </Card>
  );
}

function FrequencyCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ value: string; count: number }>;
}) {
  return (
    <Card className="border-border/60 bg-background/55 p-6 shadow-xl backdrop-blur">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.value}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
            >
              <span className="text-sm text-foreground/90">{item.value}</span>
              <Badge variant="secondary">{item.count}</Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No signals yet.</p>
        )}
      </div>
    </Card>
  );
}

function collectTopValues(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))
    .slice(0, 8);
}
