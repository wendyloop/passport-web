/*
 * Paused hidden workspace.
 * Preserved for future reuse, but currently unregistered while the product is
 * focused on the public referral experience.
 */
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortalGuard } from "@/components/portal/PortalGuard";
import { PortalLoadingCard } from "@/components/portal/PortalFrame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createSignedResumeUrl,
  fetchAdminEmployerActions,
  fetchApplications,
} from "@/lib/portal-data";

export const Route = createFileRoute("/portal/admin")({
  component: PortalAdminRoute,
});

function PortalAdminRoute() {
  return (
    <PortalGuard allowedRoles={["admin"]}>
      <PortalAdminWorkspace />
    </PortalGuard>
  );
}

function PortalAdminWorkspace() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [parseFilter, setParseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const applicationsQuery = useQuery({
    queryKey: ["portal-applications"],
    queryFn: fetchApplications,
  });
  const employerActionsQuery = useQuery({
    queryKey: ["portal-admin-employer-actions"],
    queryFn: fetchAdminEmployerActions,
  });

  const filteredApplications = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return (applicationsQuery.data ?? []).filter((application) => {
      if (statusFilter !== "all" && application.status !== statusFilter) {
        return false;
      }

      if (parseFilter !== "all" && application.resume_parse_status !== parseFilter) {
        return false;
      }

      if (categoryFilter !== "all" && !application.interview_categories.includes(categoryFilter)) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const haystack = [
        application.name,
        application.email,
        application.linkedin ?? "",
        application.most_recent_role ?? "",
        application.interview_details ?? "",
        application.schools.join(" "),
        application.companies.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [applicationsQuery.data, categoryFilter, parseFilter, search, statusFilter]);

  if (applicationsQuery.isLoading || employerActionsQuery.isLoading) {
    return <PortalLoadingCard />;
  }

  const actionsByCandidate = new Map<string, number>();
  for (const action of employerActionsQuery.data ?? []) {
    if (!action.shortlisted && !action.notes) {
      continue;
    }
    actionsByCandidate.set(
      action.application_id,
      (actionsByCandidate.get(action.application_id) ?? 0) + 1,
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr,1fr,1fr]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search candidate, school, company, role, or notes"
        />
        <PortalSelect
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="Submission status"
          options={["all", "draft", "submitted", "reviewing", "archived"]}
        />
        <PortalSelect
          value={parseFilter}
          onValueChange={setParseFilter}
          placeholder="Resume parse status"
          options={["all", "pending", "completed", "failed"]}
        />
        <PortalSelect
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          placeholder="Interview category"
          options={["all", "tech", "consulting", "finance", "investing"]}
        />
      </div>

      <Card className="border-border/60 bg-background/60 p-4 shadow-xl backdrop-blur">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Applicants</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredApplications.length} candidate{filteredApplications.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Most recent role</TableHead>
              <TableHead>Schools</TableHead>
              <TableHead>Companies</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Employer activity</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((application) => (
              <TableRow key={application.id}>
                <TableCell>
                  <div className="font-medium">{application.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{application.email}</div>
                </TableCell>
                <TableCell>{application.most_recent_role ?? "Unknown"}</TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {application.schools.join(", ") || "None parsed"}
                </TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {application.companies.join(", ") || "None parsed"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{application.status}</Badge>
                    <Badge variant="secondary">{application.resume_parse_status}</Badge>
                  </div>
                </TableCell>
                <TableCell>{actionsByCandidate.get(application.id) ?? 0}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link
                        to="/portal/candidates/$applicationId"
                        params={{ applicationId: application.id }}
                      >
                        View profile
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void openResume(application.resume_path);
                      }}
                    >
                      Resume
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PortalSelect({
  value,
  onValueChange,
  placeholder,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

async function openResume(resumePath: string) {
  const signedUrl = await createSignedResumeUrl(resumePath);
  window.open(signedUrl, "_blank", "noopener,noreferrer");
}
