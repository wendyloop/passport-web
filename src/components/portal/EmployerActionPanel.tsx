import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveEmployerCandidateAction, type EmployerCandidateAction } from "@/lib/portal-data";
import { usePortalAuth } from "@/lib/portal-auth";
import { toast } from "sonner";

export function EmployerActionPanel({
  applicationId,
  initialAction,
}: {
  applicationId: string;
  initialAction?: EmployerCandidateAction;
}) {
  const queryClient = useQueryClient();
  const { user } = usePortalAuth();
  const [shortlisted, setShortlisted] = useState(initialAction?.shortlisted ?? false);
  const [notes, setNotes] = useState(initialAction?.notes ?? "");

  useEffect(() => {
    setShortlisted(initialAction?.shortlisted ?? false);
    setNotes(initialAction?.notes ?? "");
  }, [initialAction]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("You must be signed in to save employer actions.");
      }

      return saveEmployerCandidateAction({
        applicationId,
        employerUserId: user.id,
        shortlisted,
        notes,
      });
    },
    onSuccess: () => {
      toast.success("Candidate preferences saved.");
      void queryClient.invalidateQueries({ queryKey: ["portal-employer-actions"] });
      void queryClient.invalidateQueries({ queryKey: ["portal-admin-employer-actions"] });
      void queryClient.invalidateQueries({ queryKey: ["portal-candidate", applicationId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not save employer actions.");
    },
  });

  return (
    <Card className="border-border/60 bg-background/60 p-5 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Employer actions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Shortlist this candidate and keep private review notes for your team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor={`shortlist-${applicationId}`} className="text-sm">
            Shortlisted
          </Label>
          <Switch
            id={`shortlist-${applicationId}`}
            checked={shortlisted}
            onCheckedChange={setShortlisted}
          />
        </div>
      </div>
      <div className="mt-5">
        <Label htmlFor={`notes-${applicationId}`}>Private notes</Label>
        <Textarea
          id={`notes-${applicationId}`}
          rows={6}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Capture interview fit, follow-up thoughts, or shortlist rationale."
          className="mt-2"
        />
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => {
            mutation.mutate();
          }}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save shortlist + notes"}
        </Button>
      </div>
    </Card>
  );
}
