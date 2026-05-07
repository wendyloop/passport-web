import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Medal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReferral } from "@/lib/referral-submission";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

const TOTAL_STEPS = 3;

function Index() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [referrerEmail, setReferrerEmail] = useState("");
  const [ycBatch, setYcBatch] = useState("");

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [roleInterviewedFor, setRoleInterviewedFor] = useState("");
  const [roundReached, setRoundReached] = useState("");
  const [whyNotHire, setWhyNotHire] = useState("");

  const [exceptionalWhy, setExceptionalWhy] = useState("");
  const [strengthDraft, setStrengthDraft] = useState("");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [foundersNote, setFoundersNote] = useState("");

  const stepTitle = useMemo(() => {
    if (step === 1) {
      return "Tell us about your company";
    }
    if (step === 2) {
      return "Who is your silver medalist?";
    }
    return "Why were they exceptional?";
  }, [step]);

  function nextStep() {
    const error = validateStep(step, {
      companyName,
      referrerName,
      referrerEmail,
      ycBatch,
      candidateName,
      candidateEmail,
      roleInterviewedFor,
      roundReached,
      whyNotHire,
      exceptionalWhy,
      strengths,
      foundersNote,
    });

    if (error) {
      toast.error(error);
      return;
    }

    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 1));
  }

  function addStrength() {
    const normalized = strengthDraft.trim();

    if (!normalized) {
      toast.error("Add a strength before saving it.");
      return;
    }

    setStrengths((current) => Array.from(new Set([...current, normalized])));
    setStrengthDraft("");
  }

  function removeStrength(strength: string) {
    setStrengths((current) => current.filter((value) => value !== strength));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const error = validateStep(3, {
      companyName,
      referrerName,
      referrerEmail,
      ycBatch,
      candidateName,
      candidateEmail,
      roleInterviewedFor,
      roundReached,
      whyNotHire,
      exceptionalWhy,
      strengths,
      foundersNote,
    });

    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      await submitReferral({
        companyName,
        referrerName,
        referrerEmail,
        ycBatch,
        candidateName,
        candidateEmail,
        roleInterviewedFor,
        roundReached,
        whyNotHire,
        exceptionalWhy,
        strengths,
        foundersNote,
      });
      setSubmitted(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong while submitting.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "var(--gradient-subtle)" }}
      >
        <Card className="max-w-md p-8 text-center" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--gradient-primary)" }}
          >
            <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Referral submitted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thanks {referrerName.split(" ")[0] || referrerName}. We received your silver medalist
            referral for {candidateName}.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
            Submit another referral
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--gradient-subtle)" }}>
      <header className="px-4 pb-12 pt-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Founder referral
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Send us the strongest candidate you almost hired
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          We want your silver medalists: the candidates who were genuinely exceptional, made it far,
          and deserve another shot with the right company.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4">
        <Card className="p-6 sm:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionHeader step={step} title={stepTitle} />
            <div className="text-sm text-muted-foreground">
              Step {step} of {TOTAL_STEPS}
            </div>
          </div>

          <ProgressDots step={step} />

          {step === 1 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Company name" required>
                <Input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Acme AI"
                  required
                />
              </Field>
              <Field label="Your name" required>
                <Input
                  value={referrerName}
                  onChange={(event) => setReferrerName(event.target.value)}
                  placeholder="Jane Founder"
                  required
                />
              </Field>
              <Field label="Your email" required>
                <Input
                  type="email"
                  value={referrerEmail}
                  onChange={(event) => setReferrerEmail(event.target.value)}
                  placeholder="jane@company.com"
                  required
                />
              </Field>
              <Field label="YC batch" required hint="Use the short code, e.g. W24, S23, X25.">
                <Input
                  value={ycBatch}
                  onChange={(event) => setYcBatch(event.target.value)}
                  placeholder="W24"
                  required
                />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Medal className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Who’s your silver medalist?</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The candidate who was outstanding, made it deep, and still deserves another
                      founder-backed shot.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Candidate name" required>
                  <Input
                    value={candidateName}
                    onChange={(event) => setCandidateName(event.target.value)}
                    placeholder="Alex Candidate"
                    required
                  />
                </Field>
                <Field label="Candidate email" required>
                  <Input
                    type="email"
                    value={candidateEmail}
                    onChange={(event) => setCandidateEmail(event.target.value)}
                    placeholder="alex@example.com"
                    required
                  />
                </Field>
                <Field label="Role interviewed for" required>
                  <Input
                    value={roleInterviewedFor}
                    onChange={(event) => setRoleInterviewedFor(event.target.value)}
                    placeholder="Founding product manager"
                    required
                  />
                </Field>
                <Field label="Round reached" required>
                  <Input
                    value={roundReached}
                    onChange={(event) => setRoundReached(event.target.value)}
                    placeholder="Final round / onsite / founder round"
                    required
                  />
                </Field>
              </div>

              <Field label="Why not hire?" required>
                <Textarea
                  value={whyNotHire}
                  onChange={(event) => setWhyNotHire(event.target.value)}
                  rows={6}
                  placeholder="What ultimately prevented you from hiring them?"
                  required
                />
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-6 space-y-5">
              <Field label="What made them exceptional?" required>
                <Textarea
                  value={exceptionalWhy}
                  onChange={(event) => setExceptionalWhy(event.target.value)}
                  rows={5}
                  placeholder="What stood out? Judgment, pace, communication, ownership, founder instinct, etc."
                  required
                />
              </Field>

              <Field
                label="Strengths noted"
                required
                hint="List the strengths you observed. Add one strength at a time."
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={strengthDraft}
                    onChange={(event) => setStrengthDraft(event.target.value)}
                    placeholder="Exceptional product taste"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addStrength();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addStrength}>
                    Add strength
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {strengths.map((strength) => (
                    <button
                      key={strength}
                      type="button"
                      onClick={() => removeStrength(strength)}
                      className="rounded-full border border-border bg-muted/30 px-3 py-1 text-sm text-foreground transition-colors hover:bg-muted/50"
                    >
                      {strength} ×
                    </button>
                  ))}
                  {!strengths.length ? (
                    <p className="text-xs text-muted-foreground">No strengths added yet.</p>
                  ) : null}
                </div>
              </Field>

              <Field
                label="Founder's note"
                required
                hint="Anything candid or directional that would help another founder evaluate them well."
              >
                <Textarea
                  value={foundersNote}
                  onChange={(event) => setFoundersNote(event.target.value)}
                  rows={6}
                  placeholder="Share the context you’d tell another founder privately."
                  required
                />
              </Field>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={previousStep} disabled={step === 1}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={nextStep}
                className="border-0 text-primary-foreground"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-elegant)",
                }}
              >
                Next page
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitting}
                className="border-0 text-primary-foreground"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-elegant)",
                }}
              >
                {submitting ? "Submitting referral…" : "Submit referral"}
              </Button>
            )}
          </div>
        </Card>
      </form>
    </main>
  );
}

function validateStep(
  step: number,
  values: {
    companyName: string;
    referrerName: string;
    referrerEmail: string;
    ycBatch: string;
    candidateName: string;
    candidateEmail: string;
    roleInterviewedFor: string;
    roundReached: string;
    whyNotHire: string;
    exceptionalWhy: string;
    strengths: string[];
    foundersNote: string;
  },
) {
  if (step === 1) {
    if (
      !values.companyName.trim() ||
      !values.referrerName.trim() ||
      !values.referrerEmail.trim() ||
      !values.ycBatch.trim()
    ) {
      return "Please complete company name, your name, your email, and YC batch.";
    }
  }

  if (step === 2) {
    if (
      !values.candidateName.trim() ||
      !values.candidateEmail.trim() ||
      !values.roleInterviewedFor.trim() ||
      !values.roundReached.trim() ||
      !values.whyNotHire.trim()
    ) {
      return "Please complete all silver medalist details before moving on.";
    }
  }

  if (step === 3) {
    if (!values.exceptionalWhy.trim() || !values.foundersNote.trim() || !values.strengths.length) {
      return "Please add what made them exceptional, at least one strength, and a founder's note.";
    }
  }

  return null;
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="mt-5 flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const value = index + 1;

        return (
          <div
            key={value}
            className={`h-2 rounded-full transition-all ${value <= step ? "bg-primary" : "bg-border"} ${
              value === step ? "w-10" : "w-6"
            }`}
          />
        );
      })}
    </div>
  );
}

function SectionHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
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
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
