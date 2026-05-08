/*
 * Paused hidden workspace.
 * Preserved for future reuse, but currently unregistered while the product is
 * focused on the public referral experience.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Search } from "lucide-react";
import { PortalGuard } from "@/components/portal/PortalGuard";
import { TalentEmployerActionPanel } from "@/components/talent/TalentEmployerActionPanel";
import { TalentProfileCard } from "@/components/talent/TalentProfileCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createSignedTalentResumeUrl,
  deleteTalentSavedSearch,
  fetchTalentEmployerActionsForCurrentEmployer,
  fetchTalentSavedSearches,
  saveTalentSearch,
  searchTalent,
} from "@/lib/talent-data";
import { usePortalAuth } from "@/lib/portal-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/talent/search")({
  component: TalentSearchRoute,
});

function TalentSearchRoute() {
  return (
    <PortalGuard allowedRoles={["admin", "employer"]}>
      <TalentSearchWorkspace />
    </PortalGuard>
  );
}

function TalentSearchWorkspace() {
  const { user, role } = usePortalAuth();
  const queryClient = useQueryClient();
  const [draftQuery, setDraftQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const searchMutation = useMutation({
    mutationFn: (query: string) => searchTalent(query),
  });
  const employerActionsQuery = useQuery({
    queryKey: ["talent-employer-actions"],
    queryFn: fetchTalentEmployerActionsForCurrentEmployer,
    enabled: role === "employer",
  });
  const savedSearchesQuery = useQuery({
    queryKey: ["talent-saved-searches", user?.id],
    queryFn: () => fetchTalentSavedSearches(user!.id),
    enabled: Boolean(user),
  });
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("User session is required.");
      }

      const title = window.prompt("Save this search as:");
      if (!title?.trim()) {
        throw new Error("Search title is required.");
      }

      return saveTalentSearch({
        userId: user.id,
        title: title.trim(),
        query: activeQuery,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["talent-saved-searches", user?.id] });
      toast.success("Search saved.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not save search.");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTalentSavedSearch,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["talent-saved-searches", user?.id] });
    },
  });

  useEffect(() => {
    searchMutation.mutate("");
  }, [searchMutation]);

  const actionByProfile = new Map(
    (employerActionsQuery.data ?? []).map((action) => [action.talent_profile_id, action]),
  );

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-background/55 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <label htmlFor="talent-query" className="text-sm font-medium">
              Search candidates with natural language
            </label>
            <Input
              id="talent-query"
              className="mt-2 h-12"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="ex-McKinsey candidates from Stanford or Harvard for growth roles"
            />
          </div>
          <Button
            size="lg"
            onClick={() => {
              setActiveQuery(draftQuery);
              searchMutation.mutate(draftQuery);
            }}
            disabled={searchMutation.isPending}
          >
            <Search className="mr-2 h-4 w-4" />
            {searchMutation.isPending ? "Searching…" : "Search"}
          </Button>
          {activeQuery ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Save search
            </Button>
          ) : null}
        </div>

        {searchMutation.data?.plan ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {searchMutation.data.plan.school_filters.map((filterValue) => (
              <Badge key={`school-${filterValue}`} variant="outline">
                School: {filterValue}
              </Badge>
            ))}
            {searchMutation.data.plan.company_filters.map((filterValue) => (
              <Badge key={`company-${filterValue}`} variant="outline">
                Company: {filterValue}
              </Badge>
            ))}
            {searchMutation.data.plan.role_filters.map((filterValue) => (
              <Badge key={`role-${filterValue}`} variant="outline">
                Role: {filterValue}
              </Badge>
            ))}
            {searchMutation.data.plan.semantic_query ? (
              <Badge variant="secondary">
                Semantic query: {searchMutation.data.plan.semantic_query}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.78fr,1.22fr]">
        <Card className="border-border/60 bg-background/55 p-5 shadow-xl backdrop-blur">
          <h3 className="text-lg font-semibold tracking-tight">Saved searches</h3>
          <div className="mt-4 space-y-3">
            {(savedSearchesQuery.data ?? []).map((savedSearch) => (
              <div
                key={savedSearch.id}
                className="rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <p className="font-medium">{savedSearch.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{savedSearch.query}</p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setDraftQuery(savedSearch.query);
                      setActiveQuery(savedSearch.query);
                      searchMutation.mutate(savedSearch.query);
                    }}
                  >
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(savedSearch.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {!savedSearchesQuery.data?.length ? (
              <p className="text-sm text-muted-foreground">
                Save your high-signal recruiting prompts to rerun them as the resume graph grows.
              </p>
            ) : null}
          </div>
        </Card>

        <div className="space-y-4">
          {(searchMutation.data?.results ?? []).map((result) => (
            <div key={result.id} className="space-y-4">
              <TalentProfileCard
                result={result}
                resumeAction={() => {
                  void openResume(result.source_resume_path);
                }}
              />
              {role === "employer" && user ? (
                <TalentEmployerActionPanel
                  profileId={result.id}
                  initialAction={actionByProfile.get(result.id)}
                />
              ) : null}
            </div>
          ))}

          {!searchMutation.data?.results.length && !searchMutation.isPending ? (
            <Card className="border-border/60 bg-background/55 p-6 shadow-xl backdrop-blur">
              <p className="text-sm text-muted-foreground">
                No candidates matched this query yet. Try fewer filters or a broader semantic
                description.
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

async function openResume(path: string) {
  const signedUrl = await createSignedTalentResumeUrl(path);
  window.open(signedUrl, "_blank", "noopener,noreferrer");
}
