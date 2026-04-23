import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { ResumeUpload } from "@/components/application/ResumeUpload";
import { VideoCapture } from "@/components/application/VideoCapture";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

const INTERVIEW_CATEGORIES = [
  { id: "bigtech", label: "FAANG / Big Tech & Unicorn Startups", hint: "Meta, Apple, Amazon, Netflix, Google, Microsoft, Stripe, OpenAI, Anthropic, SpaceX, etc." },
  { id: "consulting", label: "MBB & Tier 2 Consulting", hint: "McKinsey, BCG, Bain, Deloitte, Accenture, Oliver Wyman, etc." },
  { id: "vc", label: "Venture Capital", hint: "a16z, Sequoia, Benchmark, etc." },
  { id: "pe-hf", label: "Private Equity / Hedge Funds", hint: "Blackstone, Citadel, Two Sigma, etc." },
  { id: "ib", label: "Investment Banking", hint: "Goldman Sachs, Morgan Stanley, JPM, etc." },
  { id: "yc", label: "YC / Early-stage Startups", hint: "Y Combinator companies, seed-stage" },
] as const;

function Index() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [categories, setCategories] = useState<Record<string, boolean>>({});
  const [interviewDetails, setInterviewDetails] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  function toggleCategory(id: string, checked: boolean) {
    setCategories((prev) => ({ ...prev, [id]: checked }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please add your name and email.");
      return;
    }
    if (!resume) {
      toast.error("Please upload your resume.");
      return;
    }
    if (!video) {
      toast.error("Please record or upload your 1-min intro video.");
      return;
    }
    setSubmitting(true);
    // No backend yet — simulate submission so users see end-to-end flow.
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-subtle)" }}>
        <Card className="max-w-md p-8 text-center" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--gradient-primary)" }}>
            <CheckCircle2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Application received</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Thanks {name.split(" ")[0]} — we'll review your materials and reach out via {email}.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
            Submit another
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--gradient-subtle)" }}>
      <Toaster richColors position="top-center" />

      {/* Hero */}
      <header className="px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Candidate Application
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight max-w-2xl mx-auto leading-tight">
          Tell us about your experience
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Share your interview track record, resume, and a 1-minute intro video. Takes about 5 minutes.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Basic info */}
        <Card className="p-6 sm:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <SectionHeader step={1} title="Basic info" />
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <Field label="Full name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" required />
            </Field>
            <div className="sm:col-span-2">
              <Field label="LinkedIn (optional)">
                <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/janedoe" />
              </Field>
            </div>
          </div>
        </Card>

        {/* Interviews */}
        <Card className="p-6 sm:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <SectionHeader step={2} title="Previous interviews" />
          <p className="text-sm text-muted-foreground mt-1">
            Check any category where you've reached a final round (or close to it). Add specifics below.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            {INTERVIEW_CATEGORIES.map((cat) => {
              const checked = !!categories[cat.id];
              return (
                <label
                  key={cat.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => toggleCategory(cat.id, !!v)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight">{cat.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{cat.hint}</div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="mt-5">
            <Field
              label="Tell us more"
              hint="Which companies, what role, how far did you get? E.g. 'Final round at Google L4 SWE, offer from Bain ACI, onsite at Sequoia summer associate.'"
            >
              <Textarea
                value={interviewDetails}
                onChange={(e) => setInterviewDetails(e.target.value)}
                rows={5}
                placeholder="Share your most relevant interview experiences…"
              />
            </Field>
          </div>
        </Card>

        {/* Resume */}
        <Card className="p-6 sm:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <SectionHeader step={3} title="Resume" />
          <p className="text-sm text-muted-foreground mt-1 mb-5">PDF or Word document, up to 10MB.</p>
          <ResumeUpload value={resume} onChange={setResume} />
        </Card>

        {/* Video */}
        <Card className="p-6 sm:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <SectionHeader step={4} title="1-minute intro video" />
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Cover three things: <strong className="text-foreground">your name</strong>,{" "}
            <strong className="text-foreground">your background</strong>, and{" "}
            <strong className="text-foreground">one project you want to highlight</strong>. Record on your
            phone or directly here.
          </p>
          <VideoCapture value={video} onChange={setVideo} />
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="text-primary-foreground border-0 px-8"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
          >
            {submitting ? "Submitting…" : "Submit application"}
          </Button>
        </div>
      </form>
    </main>
  );
}

function SectionHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center shrink-0">
        {step}
      </div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
