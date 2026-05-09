import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, KeyRound, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyCandidateInvite } from "@/lib/candidate-portal";

const EMAIL_PATTERN = /^[^\s@]{3,}@[^\s@]+\.[^\s@]+$/i;

export const Route = createFileRoute("/candidate")({
  head: () => ({
    meta: [
      { title: "I've Been Referred — Passport" },
      {
        name: "description",
        content:
          "Claim your Passport referral with the secure invite from your email or by entering your email and claim code.",
      },
    ],
  }),
  component: CandidatePage,
});

function CandidatePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const claimMutation = useMutation({
    mutationFn: async () => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedCode = code.trim();

      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        throw new Error("Enter the same email the referral was sent to.");
      }

      if (!normalizedCode) {
        throw new Error("Enter the 6-digit claim code from your email.");
      }

      await verifyCandidateInvite({
        email: normalizedEmail,
        code: normalizedCode,
      });

      return {
        code: normalizedCode,
        email: normalizedEmail,
      };
    },
    onSuccess: ({ email: verifiedEmail, code: verifiedCode }) => {
      navigate({
        to: "/candidate/claim",
        search: {
          email: verifiedEmail,
          code: verifiedCode,
        },
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not verify this claim code.");
    },
  });

  return (
    <main className="font-public-sans min-h-screen bg-[#fbf9f4] px-4 py-12 text-[#171a22]">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[2rem] border border-[#dbe2e7] bg-white p-8 shadow-[0_24px_80px_-28px_rgba(38,49,64,0.16)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef9f3] text-[#22a56a]">
            <UserRound className="h-7 w-7" />
          </div>
          <p className="font-public-mono mt-6 text-center text-xs uppercase tracking-[0.32em] text-[#22a56a]">
            Passport
          </p>
          <h1 className="font-public-display mt-4 text-center text-4xl tracking-tight sm:text-5xl">
            You&apos;ve been referred
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center text-lg leading-8 text-[#697386]">
            If a founder vouched for you, Passport emails you the exact referral context before
            anything is shared.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-[#e5ebf0] bg-[#fcfdfd] p-5">
            <p className="font-public-mono text-xs uppercase tracking-[0.24em] text-[#667084]">
              What the invite email includes
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[#475467]">
              <li>The founder and company who referred you.</li>
              <li>The role you interviewed for and the referral context.</li>
              <li>A secure one-click profile link.</li>
              <li>A 6-digit claim code you can enter manually here.</li>
            </ul>
          </div>
          <p className="mt-6 text-center text-sm leading-7 text-[#667084]">
            Already opened the email? You can either use the button in the email or enter the code
            on this page.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild className="rounded-xl bg-[#22a56a] px-6 text-white hover:bg-[#1d905d]">
              <Link to="/refer">
                Submit a referral
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-[#d7dde3] bg-white px-6 text-[#171a22] hover:bg-[#f6f8fa]"
            >
              <Link to="/">Back to homepage</Link>
            </Button>
          </div>
        </Card>

        <Card className="rounded-[2rem] border border-[#dbe2e7] bg-white p-8 shadow-[0_24px_80px_-28px_rgba(38,49,64,0.16)] sm:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef9f3] text-[#22a56a]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="font-public-mono text-xs uppercase tracking-[0.24em] text-[#22a56a]">
                Claim with code
              </p>
              <h2 className="font-public-display mt-2 text-3xl tracking-tight">
                Enter your invite details
              </h2>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <CandidateField label="Candidate email">
              <WarmInput
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                type="email"
                value={email}
              />
            </CandidateField>

            <CandidateField label="Claim code">
              <WarmInput
                autoCapitalize="characters"
                autoCorrect="off"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setCode(event.target.value.replace(/\s+/g, ""))}
                placeholder="6-digit code from your email"
                value={code}
              />
            </CandidateField>

            <p className="text-sm leading-7 text-[#667084]">
              If you don&apos;t have the email handy, enter the exact email the founder used plus
              the claim code from the message we sent you.
            </p>
          </div>

          <div className="mt-8">
            <Button
              type="button"
              className="h-12 w-full rounded-xl bg-[#22a56a] text-white hover:bg-[#1d905d]"
              disabled={claimMutation.isPending}
              onClick={() => claimMutation.mutate()}
            >
              {claimMutation.isPending ? "Checking code..." : "Continue to my profile"}
              {!claimMutation.isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

function CandidateField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <Label className="font-public-mono text-xs uppercase tracking-[0.2em] text-[#667084]">
        {label}
      </Label>
      {children}
    </div>
  );
}

function WarmInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={`h-12 rounded-2xl border-[#d7dde3] bg-white px-4 text-base text-[#171a22] placeholder:text-[#98a2b3] focus-visible:ring-[#22a56a] ${props.className ?? ""}`}
    />
  );
}
