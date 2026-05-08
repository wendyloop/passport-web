import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Medal,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReferral } from "@/lib/referral-submission";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Passport — The Peer Referral Network for Tech" },
      {
        name: "description",
        content:
          "Passport captures the candidates companies loved but couldn't hire and surfaces them to founders who can. The warm referral, legitimized.",
      },
    ],
  }),
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
      <main className="flex min-h-screen items-center justify-center bg-[#f5efe6] px-4 py-10 text-[#1f1915]">
        <Card className="max-w-xl rounded-[2rem] border-[#dfd3c5] bg-[#fffaf3] p-10 text-center shadow-[0_24px_80px_-28px_rgba(66,42,22,0.28)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1f1915]">
            <CheckCircle2 className="h-8 w-8 text-[#f8f2e9]" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-[#8b6f57]">Passport</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Referral submitted</h1>
          <p className="mt-3 text-sm leading-6 text-[#6f5d4c]">
            Thanks {referrerName.split(" ")[0] || referrerName}. We received your silver medalist
            referral for {candidateName}. We&apos;ll review it and handle the next step with care.
          </p>
          <Button
            className="mt-7 rounded-full border-[#d8c7b3] bg-transparent px-6 text-[#1f1915] hover:bg-[#f1e8db]"
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
    <main className="min-h-screen bg-[#f5efe6] text-[#1f1915]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="rounded-full border border-[#ddcfbf] bg-[#fff8ee] px-4 py-2 text-sm font-medium tracking-[0.16em] text-[#3c3027]">
            Passport
          </div>
          <div className="rounded-full border border-[#ddcfbf] bg-[#efe4d2] px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#7a634e]">
            Launching with YC W25 cohort
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-start">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e1d5c7] bg-[#fff8ef] px-4 py-2 text-xs font-medium uppercase tracking-[0.26em] text-[#8a7058]">
              <Sparkles className="h-3.5 w-3.5" />
              Built for YC founders and the candidates they vouch for
            </div>

            <div className="space-y-5">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#8a7058]">
                The peer referral network for tech
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
                The best candidates aren&apos;t applying.
                <span className="block text-[#7e5e42]">They&apos;re being vouched for.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#5d4b3d]">
                Passport captures the candidates companies loved but couldn&apos;t hire and surfaces
                them to founders who can. The warm referral, legitimized.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StoryCard
                icon={Medal}
                title="A founder refers a silver medalist"
                description="Enter the candidate you loved but couldn't hire, with context on why they stood out."
              />
              <StoryCard
                icon={ShieldCheck}
                title="The candidate is legitimized"
                description="Every profile begins with founder context, not a cold outbound or anonymous application."
              />
              <StoryCard
                icon={Users}
                title="Other founders discover vetted talent"
                description="Trusted founders browse warm referrals from peers, not keyword-stuffed profiles."
              />
            </div>

            <div className="rounded-[2rem] border border-[#e0d2c1] bg-[#fffaf3] p-6 shadow-[0_24px_80px_-32px_rgba(66,42,22,0.24)]">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#1f1915] p-3 text-[#f7efe4]">
                  <UserRoundCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Give back to great candidates
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-[#5f4f41]">
                    You met someone exceptional but only had one seat. Now you can pass their name
                    to a founder who needs exactly that person.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="lg:sticky lg:top-8">
            <Card className="overflow-hidden rounded-[2rem] border-[#dac9b6] bg-[#fffaf3] p-0 shadow-[0_28px_90px_-30px_rgba(66,42,22,0.32)]">
              <div className="border-b border-[#eadfce] bg-[#fcf5ea] px-6 py-5 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <SectionHeader step={step} title={stepTitle} />
                  <div className="text-xs font-medium uppercase tracking-[0.24em] text-[#8b6f57]">
                    Step {step} of {TOTAL_STEPS}
                  </div>
                </div>
                <ProgressDots step={step} />
              </div>

              <div className="px-6 py-6 sm:px-8 sm:py-8">
                {step === 1 ? (
                  <div className="space-y-5">
                    <p className="text-sm leading-7 text-[#635243]">
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
                      <Field
                        label="YC batch"
                        required
                        hint="Use the short code, e.g. W24, S23, X25."
                      >
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
                    <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#f7efe3] p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-[#201914] p-2.5 text-[#f7efe4]">
                          <Medal className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-[#231c17]">
                            Who&apos;s your silver medalist?
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#675648]">
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
                          className="rounded-full border-[#d6c4b2] bg-transparent text-[#1f1915] hover:bg-[#f1e8db]"
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
                            className="rounded-full border border-[#d7c7b5] bg-[#f3e9db] px-3 py-1 text-sm text-[#3b2f27] transition-colors hover:bg-[#eadcc8]"
                          >
                            {strength} ×
                          </button>
                        ))}
                        {!strengths.length ? (
                          <p className="text-xs text-[#8b7360]">No strengths added yet.</p>
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

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eadfce] bg-[#fcf5ea] px-6 py-5 sm:px-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={previousStep}
                  disabled={step === 1}
                  className="rounded-full border-[#d6c4b2] bg-transparent px-5 text-[#2a211b] hover:bg-[#efe4d2]"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {step < TOTAL_STEPS ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="rounded-full border-0 bg-[#1f1915] px-6 text-[#f7efe4] hover:bg-[#2b231d]"
                  >
                    Next page
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full border-0 bg-[#1f1915] px-6 text-[#f7efe4] hover:bg-[#2b231d]"
                  >
                    {submitting ? "Submitting referral..." : "Submit referral"}
                    {!submitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                  </Button>
                )}
              </div>
            </Card>
          </form>
        </div>
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
            className={`h-2 rounded-full transition-all ${value <= step ? "bg-[#1f1915]" : "bg-[#e5d8ca]"} ${
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1e7d9] text-sm font-semibold text-[#382d25]">
        {step}
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-[#1f1915]">{title}</h2>
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
      <Label className="text-sm font-medium text-[#342922]">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-[#8c7562]">{hint}</p> : null}
    </div>
  );
}

function StoryCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[#dfd2c2] bg-[#fff9f1] p-5 shadow-[0_18px_60px_-34px_rgba(66,42,22,0.28)]">
      <div className="w-fit rounded-2xl bg-[#1f1915] p-2.5 text-[#f7efe4]">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight text-[#231b16]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5d4b3e]">{description}</p>
    </div>
  );
}

function WarmInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={`h-12 rounded-2xl border-[#dfd1c0] bg-[#fffdf8] text-[#1f1915] placeholder:text-[#a18a76] focus-visible:ring-[#8e6e53] ${props.className ?? ""}`}
    />
  );
}

function WarmTextarea(props: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={`rounded-[1.35rem] border-[#dfd1c0] bg-[#fffdf8] text-[#1f1915] placeholder:text-[#a18a76] focus-visible:ring-[#8e6e53] ${props.className ?? ""}`}
    />
  );
}
