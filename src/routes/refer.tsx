import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReferral } from "@/lib/referral-submission";
import { toast } from "sonner";

export const Route = createFileRoute("/refer")({
  head: () => ({
    meta: [
      { title: "Submit a Referral — Passport" },
      {
        name: "description",
        content:
          "Refer a silver-medalist candidate you loved but couldn't hire and help another founder discover them.",
      },
    ],
  }),
  component: ReferPage,
});

const TOTAL_STEPS = 3;

function ReferPage() {
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
      return "Who's your silver medalist?";
    }
    return "What made them exceptional?";
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
      <main className="flex min-h-screen items-center justify-center bg-[#fbf9f4] px-4 py-10 text-[#171a22]">
        <Card className="max-w-xl rounded-[2rem] border-[#dbe2e7] bg-white p-10 text-center shadow-[0_24px_80px_-28px_rgba(38,49,64,0.16)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#171a22]">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-[#667084]">Passport</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Referral submitted</h1>
          <p className="mt-3 text-sm leading-6 text-[#697386]">
            Thanks {referrerName.split(" ")[0] || referrerName}. We received your silver medalist
            referral for {candidateName}. We&apos;ll review it and handle the next step with care.
          </p>
          <Button
            className="mt-7 rounded-full border-[#d7dde3] bg-transparent px-6 text-[#171a22] hover:bg-[#f6f8fa]"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Submit another referral
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf9f4] px-4 py-8 text-[#171a22] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-[#22a56a]">Passport</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Submit a warm referral
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#697386]">
            Share the silver medalist you loved but couldn&apos;t hire. We&apos;ll handle the
            candidate with context, consent, and care.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="overflow-hidden rounded-[2rem] border-[#dbe2e7] bg-white p-0 shadow-[0_24px_80px_-28px_rgba(38,49,64,0.16)]">
            <div className="border-b border-[#e8edf1] bg-[#fbfcfd] px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <SectionHeader step={step} title={stepTitle} />
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-[#667084]">
                  Step {step} of {TOTAL_STEPS}
                </div>
              </div>
              <ProgressDots step={step} />
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8">
              {step === 1 ? (
                <div className="space-y-5">
                  <p className="text-sm leading-7 text-[#697386]">
                    Tell us who you are and which company is making the referral.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Company name" required>
                      <WarmInput
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        placeholder="Acme AI"
                        required
                      />
                    </Field>
                    <Field label="Your name" required>
                      <WarmInput
                        value={referrerName}
                        onChange={(event) => setReferrerName(event.target.value)}
                        placeholder="Jane Founder"
                        required
                      />
                    </Field>
                    <Field label="Your email" required>
                      <WarmInput
                        type="email"
                        value={referrerEmail}
                        onChange={(event) => setReferrerEmail(event.target.value)}
                        placeholder="jane@company.com"
                        required
                      />
                    </Field>
                    <Field label="YC batch" required hint="Use the short code, e.g. W24, S23, W25.">
                      <WarmInput
                        value={ycBatch}
                        onChange={(event) => setYcBatch(event.target.value)}
                        placeholder="YC W25"
                        required
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="rounded-[1.5rem] border border-[#e8edf1] bg-[#f7faf8] p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-[#22a56a] p-2.5 text-white">
                        <Medal className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-[#171a22]">
                          Who&apos;s your silver medalist?
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#697386]">
                          Tell us about the candidate you loved but couldn&apos;t hire.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Candidate name" required>
                      <WarmInput
                        value={candidateName}
                        onChange={(event) => setCandidateName(event.target.value)}
                        placeholder="Alex Candidate"
                        required
                      />
                    </Field>
                    <Field label="Candidate email" required>
                      <WarmInput
                        type="email"
                        value={candidateEmail}
                        onChange={(event) => setCandidateEmail(event.target.value)}
                        placeholder="alex@example.com"
                        required
                      />
                    </Field>
                    <Field label="Role interviewed for" required>
                      <WarmInput
                        value={roleInterviewedFor}
                        onChange={(event) => setRoleInterviewedFor(event.target.value)}
                        placeholder="Founding engineer"
                        required
                      />
                    </Field>
                    <Field label="Round reached" required>
                      <WarmInput
                        value={roundReached}
                        onChange={(event) => setRoundReached(event.target.value)}
                        placeholder="Founder round / final round / onsite"
                        required
                      />
                    </Field>
                  </div>

                  <Field label="Why not hire?" required>
                    <WarmTextarea
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
                <div className="space-y-5">
                  <Field label="What made them exceptional?" required>
                    <WarmTextarea
                      value={exceptionalWhy}
                      onChange={(event) => setExceptionalWhy(event.target.value)}
                      rows={5}
                      placeholder="What stood out? Judgment, pace, ownership, communication, product taste, founder instinct."
                      required
                    />
                  </Field>

                  <Field
                    label="Strengths noted"
                    required
                    hint="These will help another founder understand why this person mattered."
                  >
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <WarmInput
                        value={strengthDraft}
                        onChange={(event) => setStrengthDraft(event.target.value)}
                        placeholder="Strongest systems thinker I've interviewed this year"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addStrength();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-[#d7dde3] bg-transparent text-[#171a22] hover:bg-[#f6f8fa]"
                        onClick={addStrength}
                      >
                        Add strength
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {strengths.map((strength) => (
                        <button
                          key={strength}
                          type="button"
                          onClick={() => removeStrength(strength)}
                          className="rounded-full border border-[#d7dde3] bg-[#f6f8fa] px-3 py-1 text-sm text-[#344054] transition-colors hover:bg-[#edf1f5]"
                        >
                          {strength} ×
                        </button>
                      ))}
                      {!strengths.length ? (
                        <p className="text-xs text-[#667084]">No strengths added yet.</p>
                      ) : null}
                    </div>
                  </Field>

                  <Field
                    label="Founder's note"
                    required
                    hint="This note will be shared with the candidate and visible to other founders."
                  >
                    <WarmTextarea
                      value={foundersNote}
                      onChange={(event) => setFoundersNote(event.target.value)}
                      rows={6}
                      placeholder="Strongest systems thinker I've interviewed this year. Would thrive in a technical co-founder type role at a seed-stage company."
                      required
                    />
                  </Field>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e8edf1] bg-[#fbfcfd] px-6 py-5 sm:px-8">
              <Button
                type="button"
                variant="outline"
                onClick={previousStep}
                disabled={step === 1}
                className="rounded-full border-[#d7dde3] bg-transparent px-5 text-[#171a22] hover:bg-[#f6f8fa]"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="rounded-full border-0 bg-[#22a56a] px-6 text-white hover:bg-[#1d905d]"
                >
                  Next page
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full border-0 bg-[#22a56a] px-6 text-white hover:bg-[#1d905d]"
                >
                  {submitting ? "Submitting referral..." : "Submit referral"}
                  {!submitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                </Button>
              )}
            </div>
          </Card>
        </form>
      </div>
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
            className={`h-2 rounded-full transition-all ${value <= step ? "bg-[#22a56a]" : "bg-[#e8edf1]"} ${
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef9f3] text-sm font-semibold text-[#22a56a]">
        {step}
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-[#171a22]">{title}</h2>
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
      <Label className="text-sm font-medium text-[#344054]">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-[#667084]">{hint}</p> : null}
    </div>
  );
}

function WarmInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={`h-12 rounded-2xl border-[#d7dde3] bg-white text-[#171a22] placeholder:text-[#98a2b3] focus-visible:ring-[#22a56a] ${props.className ?? ""}`}
    />
  );
}

function WarmTextarea(props: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={`rounded-[1.35rem] border-[#d7dde3] bg-white text-[#171a22] placeholder:text-[#98a2b3] focus-visible:ring-[#22a56a] ${props.className ?? ""}`}
    />
  );
}
