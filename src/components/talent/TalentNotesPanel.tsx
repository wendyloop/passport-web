import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchTalentNotes, addTalentNote } from "@/lib/talent-data";
import { usePortalAuth } from "@/lib/portal-auth";
import { toast } from "sonner";

export function TalentNotesPanel({ profileId }: { profileId: string }) {
  const { user } = usePortalAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const notesQuery = useQuery({
    queryKey: ["talent-notes", profileId],
    queryFn: () => fetchTalentNotes(profileId),
  });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Admin session is required.");
      }

      return addTalentNote({
        profileId,
        authorUserId: user.id,
        body,
      });
    },
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["talent-notes", profileId] });
      toast.success("Note saved.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not save note.");
    },
  });

  return (
    <Card className="border-border/60 bg-background/55 p-5 shadow-xl backdrop-blur">
      <h3 className="text-lg font-semibold tracking-tight">Shared notes</h3>
      <div className="mt-4 space-y-4">
        {notesQuery.data?.length ? (
          notesQuery.data.map((note) => (
            <div key={note.id} className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  {note.profiles?.full_name || note.profiles?.email || note.author_user_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{note.body}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No shared notes yet.</p>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <Textarea
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Capture context for the rest of the team."
        />
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Add note"}
        </Button>
      </div>
    </Card>
  );
}
