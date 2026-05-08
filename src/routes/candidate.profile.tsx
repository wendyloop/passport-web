import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeCandidateProfile,
  type CandidateInvitePreview,
  verifyCandidateInvite,
} from "@/lib/candidate-portal";
import { toast } from "sonner";

export const Route = createFileRoute("/candidate/profile")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
    email: typeof search.email === "string" ? search.email : "",
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Candidate Profile — Passport" },
      {
        name: "description",
        content: "Complete your Passport candidate profile.",
      },
    ],
  }),
  component: CandidateProfilePage,
});

function CandidateProfilePage() {
  const { token, email, code } = Route.useSearch();
  const lookup = getInviteLookup({ token, email, code });
  const [fullName, setFullName] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [location, setLocation] = useState("");
  const [preferredRoles, setPreferredRoles] = useState("");
  const [introNote, setIntroNote] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [submittedInvite, setSubmittedInvite] = useState<CandidateInvitePreview | null>(null);

  const inviteQuery = useQuery({
    queryKey: ["candidate-profile-invite", token || email, code || ""],
    queryFn: () => verifyCandidateInvite(lookup!),
    enabled: Boolean(lookup),
    retry: false,
  });

  useEffect(() => {
    if (!inviteQuery.data) {
      return;
    }

    const invite = inviteQuery.data;
    const existingProfile = invite.profile;
    setFullName(existingProfile?.fullName ?? invite.candidate.name ?? "");
    setLinkedin(existingProfile?.linkedin ?? "");
    setLocation(existingProfile?.location ?? "");
    setPreferredRoles(
      existingProfile?.preferredRoles.join(", ") ?? invite.referral?.roleInterviewedFor ?? "",
    );
    setIntroNote(existingProfile?.introNote ?? "");
    setConsentConfirmed(existingProfile?.consentConfirmed ?? false);
  }, [inviteQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      completeCandidateProfile({
        ...lookup!,
        fullName,
        linkedin,
        location,
        preferredRoles: preferredRoles
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        introNote,
        consentConfirmed,
      }),
    onSuccess: (invite) => {
      setSubmittedInvite(invite);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not complete your profile.");
    },
  });

  if (!lookup) {
    return (
      <CandidateProfileMessage
        title="Invite link missing"
        message="This candidate profile link is incomplete. Use the secure link from your email or enter your email and claim code on the candidate page."
      />
    );
  }

  if (submittedInvite) {
    return (
      <CandidateProfileMessage
        title="Profile created"
        message={`Your Passport profile is now ready. We'll use the referral from ${submittedInvite.referral?.companyName} to introduce you to the right founders.`}
      />
    );
  }

  if (inviteQuery.isLoading) {
    return (
      <CandidateProfileMessage
        title="Loading profile"
        message="We're preparing your profile workspace."
      />
    );
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <CandidateProfileMessage
        title="This profile link isn't available"
        message={
          inviteQuery.error instanceof Error
            ? inviteQuery.error.message
            : "We couldn't load this profile link."
        }
      />
    );
  }

  const invite = inviteQuery.data;

  return (
    <main className="font-public-sans min-h-screen bg-[#fbf9f4] px-4 py-12 text-[#171a22]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="font-public-mono text-xs uppercase tracking-[0.32em] text-[#22a56a]">
            Passport
          </p>
          <h1 className="font-public-display mt-4 text-5xl tracking-tight sm:text-6xl">
            Build your candidate profile
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#697386]">
            This profile will be attached to the referral from {invite.referral?.referrerName} at{" "}
            {invite.referral?.companyName}. Nothing is shared without your consent.
          </p>
        </div>

        <Card className="rounded-[2rem] border border-[#dbe2e7] bg-white p-8 shadow-[0_24px_80px_-28px_rgba(38,49,64,0.16)] sm:p-10">
          <div className="space-y-6">
            <ProfileField label="Full name" required>
              <WarmInput
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
              />
            </ProfileField>

            <ProfileField label="Email">
              <WarmInput value={invite.candidate.email} readOnly disabled />
            </ProfileField>

            <ProfileField label="LinkedIn">
              <WarmInput
                value={linkedin}
                onChange={(event) => setLinkedin(event.target.value)}
                placeholder="https://www.linkedin.com/in/your-name"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </ProfileField>

            <ProfileField label="Location">
              <WarmInput
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="San Francisco, CA"
              />
            </ProfileField>

            <ProfileField label="Preferred roles">
              <WarmInput
                value={preferredRoles}
                onChange={(event) => setPreferredRoles(event.target.value)}
                placeholder="Founding engineer, Staff backend, Technical PM"
              />
              <p className="text-sm text-[#667084]">
                Use commas if you want to list multiple roles.
              </p>
            </ProfileField>

            <ProfileField label="Your note to founders">
              <WarmTextarea
                value={introNote}
                onChange={(event) => setIntroNote(event.target.value)}
                rows={5}
                placeholder="What are you looking for next? What kind of team and role would be a fit?"
              />
            </ProfileField>

            <div className="rounded-[1.5rem] border border-[#dbe2e7] bg-[#fbfcfd] p-5">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={consentConfirmed}
                  onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                  className="mt-1 h-5 w-5 rounded-md border-[#cfd8df] data-[state=checked]:bg-[#22a56a] data-[state=checked]:text-white"
                />
                <div>
                  <p className="text-base font-medium text-[#171a22]">
                    I consent to Passport sharing this profile with verified founders.
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#667084]">
                    We only use this information to help the right founder discover you through the
                    warm referral that brought you here.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-[#d7dde3] bg-white px-6 text-[#171a22] hover:bg-[#f6f8fa]"
            >
              <Link to="/candidate/claim" search={lookup}>
                Back
              </Link>
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="rounded-xl bg-[#22a56a] px-6 text-white hover:bg-[#1d905d]"
            >
              {saveMutation.isPending ? "Saving profile..." : "Create my profile"}
              {!saveMutation.isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

function CandidateProfileMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="font-public-sans flex min-h-screen items-center justify-center bg-[#fbf9f4] px-4 py-12 text-[#171a22]">
      <Card className="w-full max-w-2xl rounded-[2rem] border border-[#dbe2e7] bg-white p-10 text-center shadow-[0_24px_80px_-28px_rgba(38,49,64,0.16)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef9f3] text-[#22a56a]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="font-public-mono mt-6 text-xs uppercase tracking-[0.32em] text-[#22a56a]">
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

function ProfileField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Label className="font-public-mono text-xs uppercase tracking-[0.2em] text-[#667084]">
        {label} {required ? <span className="text-destructive">*</span> : null}
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

function WarmTextarea(props: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={`rounded-2xl border-[#d7dde3] bg-white px-4 py-3 text-base leading-7 text-[#171a22] placeholder:text-[#98a2b3] focus-visible:ring-[#22a56a] ${props.className ?? ""}`}
    />
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
