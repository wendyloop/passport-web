import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePortalAuth } from "@/lib/portal-auth";
import { saveTalentEmployerAction, type TalentEmployerAction } from "@/lib/talent-data";
import { toast } from "sonner";

export function TalentEmployerActionPanel({
  profileId,
  initialAction,
}: {
  profileId: string;
  initialAction?: TalentEmployerAction;
}) {
  const { user } = usePortalAuth();
  const queryClient = useQueryClient();
  const [shortlisted, setShortlisted] = useState(initialAction?.shortlisted ?? false);
  const [notes, setNotes] = useState(initialAction?.notes ?? "");
  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Employer session is required.");
      }

      return saveTalentEmployerAction({
        profileId,
        employerUserId: user.id,
        shortlisted,
        notes,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["talent-employer-actions"] });
      void queryClient.invalidateQueries({ queryKey: ["talent-admin-employer-actions"] });
      toast.success("Candidate action saved.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not save candidate action.");
    },
  });

  return (
    <Card className="border-border/60 bg-background/55 p-5 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Employer workflow</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Save your shortlist decision and private notes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor={`talent-shortlist-${profileId}`}>Shortlist</Label>
          <Switch
            id={`talent-shortlist-${profileId}`}
            checked={shortlisted}
            onCheckedChange={setShortlisted}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor={`talent-notes-${profileId}`}>Private notes</Label>
        <Textarea
          id={`talent-notes-${profileId}`}
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Why this candidate is interesting, what to verify next, concerns, etc."
        />
      </div>

      <Button className="mt-4" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Save action"}
      </Button>
    </Card>
  );
}
