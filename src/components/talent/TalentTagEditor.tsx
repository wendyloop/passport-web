import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchTalentTags, addTalentTag, removeTalentTag } from "@/lib/talent-data";
import { usePortalAuth } from "@/lib/portal-auth";
import { toast } from "sonner";

export function TalentTagEditor({ profileId }: { profileId: string }) {
  const { user } = usePortalAuth();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const tagsQuery = useQuery({
    queryKey: ["talent-tags", profileId],
    queryFn: () => fetchTalentTags(profileId),
  });
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Admin session is required.");
      }

      return addTalentTag({
        profileId,
        label,
        createdBy: user.id,
      });
    },
    onSuccess: () => {
      setLabel("");
      void queryClient.invalidateQueries({ queryKey: ["talent-tags", profileId] });
      toast.success("Tag added.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not add tag.");
    },
  });
  const removeMutation = useMutation({
    mutationFn: removeTalentTag,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["talent-tags", profileId] });
    },
  });

  return (
    <Card className="border-border/60 bg-background/55 p-5 shadow-xl backdrop-blur">
      <h3 className="text-lg font-semibold tracking-tight">Tags</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {(tagsQuery.data ?? []).map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-2 pr-1">
            {tag.label}
            <button
              type="button"
              onClick={() => removeMutation.mutate(tag.id)}
              className="rounded-full p-0.5 transition-colors hover:bg-foreground/10"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {!tagsQuery.data?.length ? (
          <p className="text-sm text-muted-foreground">No tags applied yet.</p>
        ) : null}
      </div>

      <div className="mt-4 flex gap-3">
        <Input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Add tag"
        />
        <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
          Add
        </Button>
      </div>
    </Card>
  );
}
