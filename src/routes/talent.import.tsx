import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";
import { PortalGuard } from "@/components/portal/PortalGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchTalentImportJobs,
  createTalentImportJob,
  ingestTalentResume,
  uploadTalentResume,
} from "@/lib/talent-data";
import { usePortalAuth } from "@/lib/portal-auth";
import { toast } from "sonner";

type ImportProgress = {
  filename: string;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  detail?: string;
};

export const Route = createFileRoute("/talent/import")({
  component: TalentImportRoute,
});

function TalentImportRoute() {
  return (
    <PortalGuard allowedRoles={["admin"]}>
      <TalentImportWorkspace />
    </PortalGuard>
  );
}

function TalentImportWorkspace() {
  const { user } = usePortalAuth();
  const queryClient = useQueryClient();
  const [individualFiles, setIndividualFiles] = useState<File[]>([]);
  const [combinedPdf, setCombinedPdf] = useState<File | null>(null);
  const [progress, setProgress] = useState<ImportProgress[]>([]);
  const jobsQuery = useQuery({
    queryKey: ["talent-import-jobs"],
    queryFn: fetchTalentImportJobs,
  });

  const importMutation = useMutation({
    mutationFn: async (mode: "individual_resume" | "combined_pdf") => {
      if (!user) {
        throw new Error("Admin session is required.");
      }

      if (mode === "individual_resume") {
        if (!individualFiles.length) {
          throw new Error("Select at least one resume.");
        }

        const job = await createTalentImportJob({
          createdBy: user.id,
          sourceMode: "individual_resume",
          sourceFilename: `${individualFiles.length} uploaded resumes`,
          totalItems: individualFiles.length,
        });

        setProgress(individualFiles.map((file) => ({ filename: file.name, status: "pending" })));

        for (const file of individualFiles) {
          setProgress((current) =>
            current.map((item) =>
              item.filename === file.name ? { ...item, status: "uploading" } : item,
            ),
          );

          try {
            const filePath = await uploadTalentResume(file, job.id);
            setProgress((current) =>
              current.map((item) =>
                item.filename === file.name ? { ...item, status: "processing" } : item,
              ),
            );
            await ingestTalentResume({
              jobId: job.id,
              mode: "individual_resume",
              filePath,
              sourceFilename: file.name,
            });
            setProgress((current) =>
              current.map((item) =>
                item.filename === file.name ? { ...item, status: "completed" } : item,
              ),
            );
          } catch (error) {
            const detail = error instanceof Error ? error.message : "Could not import resume.";
            setProgress((current) =>
              current.map((item) =>
                item.filename === file.name ? { ...item, status: "failed", detail } : item,
              ),
            );
          }
        }
      } else {
        if (!combinedPdf) {
          throw new Error("Select a combined PDF.");
        }

        const job = await createTalentImportJob({
          createdBy: user.id,
          sourceMode: "combined_pdf",
          sourceFilename: combinedPdf.name,
          totalItems: 0,
        });

        setProgress([{ filename: combinedPdf.name, status: "uploading" }]);
        const filePath = await uploadTalentResume(combinedPdf, job.id);
        setProgress([{ filename: combinedPdf.name, status: "processing" }]);
        await ingestTalentResume({
          jobId: job.id,
          mode: "combined_pdf",
          filePath,
          sourceFilename: combinedPdf.name,
        });
        setProgress([{ filename: combinedPdf.name, status: "completed" }]);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["talent-import-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["talent-profiles"] }),
      ]);
      toast.success("Talent import finished.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Talent import failed.");
    },
  });

  const completionSummary = useMemo(() => {
    const completed = progress.filter((item) => item.status === "completed").length;
    const failed = progress.filter((item) => item.status === "failed").length;

    return { completed, failed, total: progress.length };
  }, [progress]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card className="border-border/60 bg-background/55 p-6 shadow-xl backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/15 p-3 text-primary">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Bulk import resumes</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Import individual PDF/DOCX resumes or one combined PDF where each page is a separate
                resume.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50 bg-muted/20 p-5">
              <Label htmlFor="individual-files" className="text-base font-medium">
                Multiple files
              </Label>
              <p className="mt-2 text-sm text-muted-foreground">
                Recommended. Upload many PDF or DOCX files and process them one by one.
              </p>
              <Input
                id="individual-files"
                className="mt-4"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                onChange={(event) => setIndividualFiles(Array.from(event.target.files ?? []))}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                {individualFiles.length
                  ? `${individualFiles.length} files selected`
                  : "No files selected yet."}
              </p>
              <Button
                className="mt-4"
                onClick={() => importMutation.mutate("individual_resume")}
                disabled={importMutation.isPending}
              >
                Process files
              </Button>
            </Card>

            <Card className="border-border/50 bg-muted/20 p-5">
              <Label htmlFor="combined-pdf" className="text-base font-medium">
                Combined PDF
              </Label>
              <p className="mt-2 text-sm text-muted-foreground">
                Use only when every page is exactly one candidate resume.
              </p>
              <Input
                id="combined-pdf"
                className="mt-4"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => setCombinedPdf(event.target.files?.[0] ?? null)}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                {combinedPdf ? combinedPdf.name : "No combined PDF selected yet."}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => importMutation.mutate("combined_pdf")}
                disabled={importMutation.isPending}
              >
                Parse combined PDF
              </Button>
            </Card>
          </div>
        </Card>

        <Card className="border-border/60 bg-background/55 p-6 shadow-xl backdrop-blur">
          <h3 className="text-xl font-semibold tracking-tight">Current batch</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge>{completionSummary.completed} completed</Badge>
            <Badge variant="secondary">{completionSummary.failed} failed</Badge>
            <Badge variant="outline">{completionSummary.total} total</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {progress.length ? (
              progress.map((item) => (
                <div
                  key={item.filename}
                  className="rounded-xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{item.filename}</p>
                    <Badge variant={item.status === "failed" ? "destructive" : "secondary"}>
                      {item.status}
                    </Badge>
                  </div>
                  {item.detail ? (
                    <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No import batch has been started yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="border-border/60 bg-background/55 p-6 shadow-xl backdrop-blur">
        <h3 className="text-xl font-semibold tracking-tight">Recent import jobs</h3>
        <div className="mt-4 space-y-3">
          {(jobsQuery.data ?? []).map((job) => (
            <div key={job.id} className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{job.source_filename}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.source_mode} · {new Date(job.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{job.status}</Badge>
                  <Badge variant="secondary">
                    {job.completed_items}/{job.total_items || "?"} complete
                  </Badge>
                  {job.failed_items ? (
                    <Badge variant="outline">{job.failed_items} failed</Badge>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
