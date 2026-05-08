import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/candidate")({
  head: () => ({
    meta: [
      { title: "I've Been Referred — Passport" },
      {
        name: "description",
        content:
          "Candidate opt-in is handled privately. If you've been referred into Passport, we'll reach out with your next step.",
      },
    ],
  }),
  component: CandidatePage,
});

function CandidatePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbf9f4] px-4 py-12 text-[#171a22]">
      <Card className="w-full max-w-2xl rounded-[2rem] border border-[#dbe2e7] bg-white p-10 text-center shadow-[0_24px_80px_-28px_rgba(38,49,64,0.16)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef9f3] text-[#22a56a]">
          <UserRound className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.32em] text-[#22a56a]">Passport</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          You&apos;ve been referred
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#697386]">
          Candidate onboarding is handled privately after a founder submits a referral. If someone
          has vouched for you, we&apos;ll email you with the exact details and an opt-in link before
          anything is shared.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
    </main>
  );
}
