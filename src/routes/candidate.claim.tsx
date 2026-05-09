import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { verifyCandidateInvite } from "@/lib/candidate-portal";

export const Route = createFileRoute("/candidate/claim")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
    email: typeof search.email === "string" ? search.email : "",
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Claim Referral — Passport" },
      {
        name: "description",
        content: "Claim your Passport referral and start building your candidate profile.",
      },
    ],
  }),
  component: CandidateClaimPage,
});

function CandidateClaimPage() {
  const { token, email, code } = Route.useSearch();
  const lookup = getInviteLookup({ token, email, code });
  const inviteQuery = useQuery({
    queryKey: ["candidate-invite", token || email, code || ""],
    queryFn: () => verifyCandidateInvite(lookup!),
    enabled: Boolean(lookup),
    retry: false,
  });

  if (!lookup) {
    return (
      <CandidateInviteMessage
        title="Invite link missing"
        message="This candidate invite link is incomplete. Use the secure link from your email or enter your email and claim code on the candidate page."
      />
    );
  }

  if (inviteQuery.isLoading) {
    return (
      <CandidateInviteMessage
        title="Checking your invite"
        message="We're loading your referral context."
      />
    );
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <CandidateInviteMessage
        title="This invite isn't available"
        message={
          inviteQuery.error instanceof Error
            ? inviteQuery.error.message
            : "We couldn't verify this invite."
        }
      />
    );
  }

  const invite = inviteQuery.data;

  return (
    <main className="font-public-sans flex min-h-screen items-center justify-center bg-[#fbf9f4] px-4 py-12 text-[#171a22]">
      <Card className="w-full max-w-3xl rounded-[2rem] border border-[#dbe2e7] bg-white p-8 shadow-[0_24px_80px_-28px_rgba(38,49,64,0.16)] sm:p-10">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef9f3] text-[#22a56a]">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="font-public-mono text-xs uppercase tracking-[0.32em] text-[#22a56a]">
              Passport
            </p>
            <h1 className="font-public-display mt-3 text-4xl tracking-tight sm:text-5xl">
              You&apos;ve been referred
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#697386]">
              {invite.referral?.referrerName} at {invite.referral?.companyName} shared your name
              with Passport after interviewing you for {invite.referral?.roleInterviewedFor}.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-[1.5rem] border border-[#e5ebf0] bg-[#fcfdfd] p-5 sm:grid-cols-2">
          <SummaryItem
            label="Round reached"
            value={invite.referral?.roundReached ?? "Not provided"}
          />
          <SummaryItem
            label="Why you stood out"
            value={(invite.referral?.strengths ?? []).join(", ") || "Not provided"}
          />
          <SummaryItem label="Referred email" value={invite.candidate.email} />
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button asChild className="rounded-xl bg-[#22a56a] px-6 text-white hover:bg-[#1d905d]">
            <Link to="/candidate/profile" search={lookup}>
              {invite.profile ? "Review my profile" : "Create my profile"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-[#d7dde3] bg-white px-6 text-[#171a22] hover:bg-[#f6f8fa]"
          >
            <Link to="/candidate">Back</Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}

function CandidateInviteMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="font-public-sans flex min-h-screen items-center justify-center bg-[#fbf9f4] px-4 py-12 text-[#171a22]">
      <Card className="w-full max-w-2xl rounded-[2rem] border border-[#dbe2e7] bg-white p-10 text-center shadow-[0_24px_80px_-28px_rgba(38,49,64,0.16)]">
        <p className="font-public-mono text-xs uppercase tracking-[0.32em] text-[#22a56a]">
          Passport
        </p>
        <h1 className="font-public-display mt-4 text-4xl tracking-tight">{title}</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#697386]">{message}</p>
        <div className="mt-8">
          <Button asChild className="rounded-xl bg-[#22a56a] px-6 text-white hover:bg-[#1d905d]">
            <Link to="/">Back to homepage</Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-public-mono text-xs uppercase tracking-[0.24em] text-[#667084]">{label}</p>
      <p className="mt-2 text-base leading-7 text-[#344054]">{value}</p>
    </div>
  );
}

function getInviteLookup({ token, email, code }: { token: string; email: string; code: string }) {
  if (token) {
    return { token } as const;
  }

  if (email && code) {
    return { email, code } as const;
  }

  return null;
}
