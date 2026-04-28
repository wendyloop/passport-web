import { Link } from "@tanstack/react-router";
import { FileText, Linkedin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TalentSearchResult } from "@/lib/talent-data";

export function TalentProfileCard({
  result,
  resumeAction,
}: {
  result: TalentSearchResult;
  resumeAction: () => void;
}) {
  return (
    <Card className="border-border/60 bg-background/55 p-5 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-semibold tracking-tight">
                {result.full_name || "Unnamed candidate"}
              </h3>
              <Badge variant="secondary">{result.score} match</Badge>
              {result.source_page_number ? (
                <Badge variant="outline">Page {result.source_page_number}</Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {result.most_recent_role || "Most recent role unavailable"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {result.reasons.map((reason) => (
              <Badge key={reason} variant="outline">
                <Sparkles className="mr-1 h-3 w-3" />
                {reason}
              </Badge>
            ))}
          </div>

          {result.summary ? (
            <p className="max-w-3xl text-sm leading-6 text-foreground/85">{result.summary}</p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <MetadataBlock
              label="Schools"
              value={result.schools.join(", ") || "No schools parsed"}
            />
            <MetadataBlock
              label="Companies"
              value={result.companies.join(", ") || "No employers parsed"}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/talent/candidates/$profileId" params={{ profileId: result.id }}>
              Open profile
            </Link>
          </Button>
          <Button variant="outline" onClick={resumeAction}>
            <FileText className="mr-2 h-4 w-4" />
            Resume
          </Button>
          {result.linkedin ? (
            <Button variant="ghost" asChild>
              <a href={normalizeUrl(result.linkedin)} target="_blank" rel="noreferrer">
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function MetadataBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-foreground/90">{value}</p>
    </div>
  );
}

function normalizeUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}
