import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
const DESKTOP_PAGE_SCALE = "lg:origin-top lg:scale-[0.7] lg:w-[142.857%]";
const EMAIL_PATTERN = /^[^\s@]{3,}@[^\s@]+\.[^\s@]+$/i;
const COMPANY_SITE_PATTERN =
  /^(https?:\/\/)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(\/.*)?$/i;
const strengthOptions = [
  "Technical depth",
  "Leadership",
  "First principles thinking",
  "Communication",
  "System design",
  "Product sense",
  "Culture add",
  "Execution speed",
  "Cross-functional",
  "Domain expertise",
];
const roundReachedOptions = [
  "Recruiter screen",
  "Hiring manager",
  "Take-home / technical screen",
  "Panel interview",
  "Onsite / founder round / final round",
];
const whyNotHiredOptions = [
  "Team fit",
  "Timing",
  "Headcount",
  "Level mismatch",
  "Role scope changed",
  "Location mismatch",
  "Compensation mismatch",
  "Another candidate accepted",
  "Hiring freeze",
  "Visa constraints",
  "Other",
];
function ReferPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companySite, setCompanySite] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [referrerEmail, setReferrerEmail] = useState("");
  const [ycBatch, setYcBatch] = useState("");

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [roleInterviewedFor, setRoleInterviewedFor] = useState("");
  const [roundReached, setRoundReached] = useState("");
  const [whyNotHire, setWhyNotHire] = useState("");
  const [whyNotHireOther, setWhyNotHireOther] = useState("");

  const [strengths, setStrengths] = useState<string[]>([]);
  const [foundersNote, setFoundersNote] = useState("");

  const stepMeta = useMemo(() => {
    if (step === 1) {
      return {
        title: "Tell us about your company",
        description: "We'll use this to verify you and attribute the referral.",
      };
    }

    if (step === 2) {
      return {
        title: "Who's your silver medalist?",
        description: "Tell us about the candidate you loved but couldn't hire.",
      };
    }

    return {
      title: "What made them exceptional?",
      description: "Select up to 5 strengths and add a personal note.",
    };
  }, [step]);

  function nextStep() {
    const error = validateStep(step, {
      companyName,
      companySite,
      referrerName,
      referrerEmail,
      ycBatch,
      candidateName,
      candidateEmail,
      roleInterviewedFor,
      roundReached,
      whyNotHire: whyNotHire === "Other" ? whyNotHireOther : whyNotHire,
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

  function handleStrengthToggle(strength: string) {
    setStrengths((current) => {
      if (current.includes(strength)) {
        return current.filter((value) => value !== strength);
      }

      if (current.length >= 5) {
        toast.error("Select up to 5 strengths.");
        return current;
      }

      return [...current, strength];
    });
  }

  function handleWhyNotHireChange(value: string) {
    setWhyNotHire(value);

    if (value !== "Other") {
      setWhyNotHireOther("");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const error = validateStep(3, {
      companyName,
      companySite,
      referrerName,
      referrerEmail,
      ycBatch,
      candidateName,
      candidateEmail,
      roleInterviewedFor,
      roundReached,
      whyNotHire,
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
        companySite,
        referrerName,
        referrerEmail,
        ycBatch,
        candidateName,
        candidateEmail,
        roleInterviewedFor,
        roundReached,
        whyNotHire: whyNotHire === "Other" ? whyNotHireOther : whyNotHire,
        exceptionalWhy: strengths.join(", "),
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
      <main className="font-public-sans flex min-h-screen items-center justify-center bg-[#fcfbf8] px-4 py-10 text-[#161a22]">
        <Card className="max-w-xl rounded-[2rem] border-[#dce2e8] bg-white p-10 text-center shadow-[0_24px_80px_-28px_rgba(38,49,64,0.14)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#161a22]">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <p className="font-public-mono text-xs uppercase tracking-[0.34em] text-[#667085]">
            Passport
          </p>
          <h1 className="font-public-display mt-3 text-3xl tracking-tight">Referral submitted</h1>
          <p className="mt-3 text-sm leading-7 text-[#667085]">
            Thanks {referrerName.split(" ")[0] || referrerName}. We received your referral for{" "}
            {candidateName} and will handle the next step with care.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              className="rounded-xl border-[#d6dde3] bg-transparent px-6 text-[#161a22] hover:bg-[#f5f7fa]"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Submit another referral
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="font-public-sans min-h-screen bg-[#fcfbf8] text-[#161a22]">
      <header className="border-b border-[#e6ebf0] bg-[#fcfbf8]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {step === 1 ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-[#667085] transition-colors hover:text-[#161a22]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          ) : (
            <button
              type="button"
              onClick={previousStep}
              className="inline-flex items-center gap-2 text-sm text-[#667085] transition-colors hover:text-[#161a22]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          <div className="font-public-display inline-flex items-center gap-3 text-[2rem] tracking-tight">
            <span className="h-3 w-3 rounded-full bg-[#22a56a]" />
            <span>Passport</span>
          </div>

          <div className="w-12" />
        </div>
      </header>

      <div
        className={`mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14 ${DESKTOP_PAGE_SCALE}`}
      >
        <form onSubmit={handleSubmit}>
          <div className="mx-auto max-w-3xl">
            <ProgressBar step={step} />

            <div className="mt-12 text-center">
              <p className="font-public-mono text-sm uppercase tracking-[0.28em] text-[#22a56a]">
                Step {step} of {TOTAL_STEPS}
              </p>
              <h1 className="font-public-display mt-5 text-5xl tracking-tight sm:text-[3.6rem]">
                {stepMeta.title}
              </h1>
              <p className="mt-4 text-xl leading-8 text-[#667085]">{stepMeta.description}</p>
            </div>

            <div className="mt-12 space-y-8">
              {step === 1 ? (
                <>
                  <Field label="Company name" required>
                    <WarmInput
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder="Acme Inc."
                      required
                    />
                  </Field>
                  <Field label="Company site" required>
                    <WarmInput
                      value={companySite}
                      onChange={(event) => setCompanySite(event.target.value)}
                      placeholder="acme.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      inputMode="url"
                      pattern={COMPANY_SITE_PATTERN.source}
                      title="Enter a valid company site, like acme.com or https://acme.com."
                      required
                    />
                  </Field>
                  <Field label="Your name" required>
                    <WarmInput
                      value={referrerName}
                      onChange={(event) => setReferrerName(event.target.value)}
                      placeholder="Jamie Lee"
                      required
                    />
                  </Field>
                  <Field label="Your email" required>
                    <WarmInput
                      type="email"
                      value={referrerEmail}
                      onChange={(event) => setReferrerEmail(event.target.value)}
                      placeholder="jamie@acme.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      inputMode="email"
                      pattern={EMAIL_PATTERN.source}
                      title="Enter a valid work email with at least 3 characters before the @."
                      required
                    />
                  </Field>
                  <Field label="YC batch" required>
                    <WarmInput
                      value={ycBatch}
                      onChange={(event) => setYcBatch(event.target.value)}
                      placeholder="W25"
                      required
                    />
                  </Field>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <Field label="Candidate name" required>
                    <WarmInput
                      value={candidateName}
                      onChange={(event) => setCandidateName(event.target.value)}
                      placeholder="Alex Chen"
                      required
                    />
                  </Field>
                  <Field label="Candidate email" required>
                    <WarmInput
                      type="email"
                      value={candidateEmail}
                      onChange={(event) => setCandidateEmail(event.target.value)}
                      placeholder="alex@email.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      inputMode="email"
                      pattern={EMAIL_PATTERN.source}
                      title="Enter a valid email with at least 3 characters before the @."
                      required
                    />
                  </Field>
                  <Field label="Role interviewed for" required>
                    <WarmInput
                      value={roleInterviewedFor}
                      onChange={(event) => setRoleInterviewedFor(event.target.value)}
                      placeholder="Head of Engineering"
                      required
                    />
                  </Field>
                  <Field label="Round reached" required>
                    <Select value={roundReached} onValueChange={setRoundReached}>
                      <WarmSelectTrigger>
                        <SelectValue placeholder="Select round reached" />
                      </WarmSelectTrigger>
                      <WarmSelectContent>
                        {roundReachedOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </WarmSelectContent>
                    </Select>
                  </Field>
                  <Field label="Why not hired?" required>
                    <Select value={whyNotHire} onValueChange={handleWhyNotHireChange}>
                      <WarmSelectTrigger>
                        <SelectValue placeholder="Select why they weren't hired" />
                      </WarmSelectTrigger>
                      <WarmSelectContent>
                        {whyNotHiredOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </WarmSelectContent>
                    </Select>
                  </Field>
                  {whyNotHire === "Other" ? (
                    <Field label="Other reason" required>
                      <WarmInput
                        value={whyNotHireOther}
                        onChange={(event) => setWhyNotHireOther(event.target.value)}
                        placeholder="Add the reason they were not hired"
                        required
                      />
                    </Field>
                  ) : null}
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <Field label="Strengths noted" required>
                    <div className="flex flex-wrap gap-3">
                      {strengthOptions.map((strength) => {
                        const active = strengths.includes(strength);

                        return (
                          <button
                            key={strength}
                            type="button"
                            onClick={() => handleStrengthToggle(strength)}
                            className={`rounded-full border px-4 py-2.5 text-lg transition-colors ${
                              active
                                ? "border-[#22a56a] bg-[#ebf8f1] text-[#1a7f55]"
                                : "border-[#d6dde3] bg-white text-[#667085] hover:border-[#bfc9d3] hover:text-[#161a22]"
                            }`}
                          >
                            {strength}
                          </button>
                        );
                      })}
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
                      rows={5}
                      placeholder="Strongest systems thinker I've interviewed this year. Would thrive in a technical co-founder type role at a seed-stage company."
                      required
                    />
                  </Field>
                </>
              ) : null}
            </div>

            <div className="mt-12 flex flex-col gap-4 sm:flex-row">
              {step === 1 ? null : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={previousStep}
                  className="h-14 flex-1 rounded-2xl border-[#d6dde3] bg-white text-lg text-[#161a22] hover:bg-[#f5f7fa]"
                >
                  Back
                </Button>
              )}

              <Button
                type={step < TOTAL_STEPS ? "button" : "submit"}
                onClick={step < TOTAL_STEPS ? nextStep : undefined}
                disabled={submitting}
                className="h-14 flex-1 rounded-2xl bg-[#22a56a] text-lg text-white hover:bg-[#1d905d]"
              >
                {step < TOTAL_STEPS
                  ? "Continue"
                  : submitting
                    ? "Submitting referral..."
                    : "Submit referral"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function validateStep(
  step: number,
  values: {
    companyName: string;
    companySite: string;
    referrerName: string;
    referrerEmail: string;
    ycBatch: string;
    candidateName: string;
    candidateEmail: string;
    roleInterviewedFor: string;
    roundReached: string;
    whyNotHire: string;
    strengths: string[];
    foundersNote: string;
  },
) {
  if (step === 1) {
    if (
      !values.companyName.trim() ||
      !values.companySite.trim() ||
      !values.referrerName.trim() ||
      !values.referrerEmail.trim() ||
      !values.ycBatch.trim()
    ) {
      return "Please complete company name, company site, your name, your email, and YC batch.";
    }

    if (!COMPANY_SITE_PATTERN.test(values.companySite.trim())) {
      return "Enter a valid company site, like acme.com.";
    }

    if (!EMAIL_PATTERN.test(values.referrerEmail.trim())) {
      return "Enter a valid work email with at least 3 characters before the @.";
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

    if (!EMAIL_PATTERN.test(values.candidateEmail.trim())) {
      return "Enter a valid candidate email with at least 3 characters before the @.";
    }
  }

  if (step === 3) {
    if (!values.strengths.length || !values.foundersNote.trim()) {
      return "Please select at least one strength and add a founder's note.";
    }
  }

  return null;
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-2.5">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const value = index + 1;

        return (
          <div
            key={value}
            className={`h-1.5 flex-1 rounded-full ${value <= step ? "bg-[#22a56a]" : "bg-[#e3e8ee]"}`}
          />
        );
      })}
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-[1.35rem] font-medium text-[#161a22]">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-sm leading-6 text-[#667085]">{hint}</p> : null}
    </div>
  );
}

function WarmInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={`h-14 rounded-2xl border-[#d6dde3] bg-white px-4 text-lg text-[#161a22] placeholder:text-[#98a2b3] focus-visible:ring-[#22a56a] ${props.className ?? ""}`}
    />
  );
}

function WarmTextarea(props: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={`rounded-2xl border-[#d6dde3] bg-white px-4 py-3 text-lg leading-8 text-[#161a22] placeholder:text-[#98a2b3] focus-visible:ring-[#22a56a] ${props.className ?? ""}`}
    />
  );
}

function WarmSelectTrigger(props: React.ComponentProps<typeof SelectTrigger>) {
  return (
    <SelectTrigger
      {...props}
      className={`h-14 rounded-2xl border-[#d6dde3] bg-white px-4 text-lg text-[#161a22] data-[placeholder]:text-[#98a2b3] focus:ring-[#22a56a] ${props.className ?? ""}`}
    />
  );
}

function WarmSelectContent(props: React.ComponentProps<typeof SelectContent>) {
  return (
    <SelectContent
      {...props}
      className={`rounded-2xl border-[#d6dde3] bg-white text-[#161a22] ${props.className ?? ""}`}
    />
  );
}
