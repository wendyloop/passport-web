import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Passport — The Peer Referral Network for Tech" },
      {
        name: "description",
        content:
          "Passport captures the candidates companies loved but couldn't hire and surfaces them to founders who can.",
      },
    ],
  }),
  component: Index,
});

const howItWorks = [
  {
    step: "01",
    title: "A founder refers a silver medalist",
    description:
      "After interviews wrap, a founder enters candidates they loved but couldn't hire — with context on strengths, role fit, and a personal note.",
  },
  {
    step: "02",
    title: "The candidate opts in on their terms",
    description:
      "We email the candidate with exactly what's been shared. They choose whether to join the network, add their own context, and control their visibility.",
  },
  {
    step: "03",
    title: "Other founders discover vetted talent",
    description:
      "Verified founders browse warm referrals from peers they trust — not cold profiles. When there's mutual interest, we facilitate the intro.",
  },
];

const audienceColumns = [
  {
    label: "For founders",
    items: [
      {
        icon: ShieldCheck,
        title: "Hire from trust, not noise",
        description:
          "Every candidate in Passport was referred by a founder who interviewed them. No cold applications. No keyword games.",
      },
      {
        icon: Sparkles,
        title: "Give back to great candidates",
        description:
          "You met someone exceptional but only had one seat. Now you can pass their name to a founder who needs exactly that person.",
      },
    ],
  },
  {
    label: "For candidates",
    items: [
      {
        icon: UserRound,
        title: "Your signal, amplified",
        description:
          "A founder vouched for you. Add your own context — intro video, preferred roles, personal note — so the next company sees the real you.",
      },
      {
        icon: BriefcaseBusiness,
        title: "Opt-in, always",
        description:
          "Nothing goes live without your consent. You control what's shared, who sees it, and can withdraw anytime.",
      },
    ],
  },
];

function Index() {
  return (
    <main className="min-h-screen bg-[#fbf9f4] text-[#171a22]">
      <section className="px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-3 text-[2rem] font-semibold tracking-tight sm:text-[2.15rem]">
            <span className="h-3.5 w-3.5 rounded-full bg-[#22a56a]" />
            <span>Passport</span>
          </div>

          <div className="mt-9 inline-flex rounded-full border border-[#dde3e8] bg-white px-5 py-2 text-[11px] uppercase tracking-[0.32em] text-[#667084] sm:text-xs">
            The peer referral network for tech
          </div>

          <h1 className="mx-auto mt-10 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl">
            Every great hire
            <span className="mt-1 block text-[#22a56a]">starts with a name</span>
            <span className="mt-1 block">someone trusts</span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-[#697386] sm:text-[1.45rem] sm:leading-10">
            Passport captures the candidates companies loved but couldn&apos;t hire — and surfaces
            them to founders who can. The warm referral, legitimized.
          </p>

          <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
            <AudienceEntryCard
              icon={BriefcaseBusiness}
              title="I'm a company"
              description="Refer a candidate you loved but couldn't hire"
              cta="Submit a referral"
              to="/refer"
            />
            <AudienceEntryCard
              icon={UserRound}
              title="I'm a candidate"
              description="You've been referred — claim your profile"
              cta="Get started"
              to="/candidate"
            />
          </div>

          <p className="mt-12 text-sm uppercase tracking-[0.3em] text-[#667084]">
            Built for YC founders and the candidates they vouch for
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs uppercase tracking-[0.32em] text-[#22a56a]">
            How it works
          </p>
          <h2 className="mt-4 text-center text-4xl font-semibold tracking-tight sm:text-5xl">
            Three steps to a better hire
          </h2>

          <div className="mt-16 divide-y divide-[#dce3e8] border-y border-[#dce3e8]">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="grid gap-6 py-10 md:grid-cols-[88px,1fr] md:items-start md:py-12"
              >
                <p className="text-xl font-semibold text-[#22a56a]">{item.step}</p>
                <div>
                  <h3 className="text-3xl font-semibold tracking-tight sm:text-[2.15rem]">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-[#697386]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs uppercase tracking-[0.32em] text-[#22a56a]">
            Two sides, one network
          </p>
          <h2 className="mx-auto mt-4 max-w-4xl text-center text-4xl font-semibold tracking-tight sm:text-5xl">
            Built for founders and candidates alike
          </h2>

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            {audienceColumns.map((column) => (
              <div key={column.label}>
                <p className="text-sm uppercase tracking-[0.28em] text-[#667084]">{column.label}</p>
                <div className="mt-6 space-y-6">
                  {column.items.map((item) => (
                    <BenefitCard
                      key={item.title}
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#dce3e8] px-4 pb-0 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto h-4 w-4 rounded-full bg-[#22a56a]" />
          <h2 className="mx-auto mt-8 max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            The best candidates aren&apos;t applying.
            <span className="block">They&apos;re being vouched for.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-[#697386]">
            Whether you&apos;re a founder with a silver medalist or a candidate ready to be
            discovered — get started now.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              className="h-12 min-w-[220px] rounded-xl bg-[#22a56a] px-7 text-base font-medium text-white hover:bg-[#1d905d]"
            >
              <Link to="/refer">
                <BriefcaseBusiness className="mr-2 h-4 w-4" />
                Submit a referral
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 min-w-[220px] rounded-xl border-[#d7dde3] bg-white px-7 text-base font-medium text-[#171a22] hover:bg-[#f6f8fa]"
            >
              <Link to="/candidate">
                <UserRound className="mr-2 h-4 w-4" />
                I&apos;ve been referred
              </Link>
            </Button>
          </div>

          <p className="mt-8 text-sm uppercase tracking-[0.28em] text-[#667084]">
            Launching with YC W25 cohort
          </p>
        </div>

        <footer className="mt-20 border-t border-[#dce3e8] px-4 py-10 sm:px-0">
          <div className="mx-auto max-w-5xl text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#667084] sm:gap-8">
              <span>Privacy Policy</span>
              <span>Terms of Use</span>
              <span>Terms of Service</span>
            </div>

            <div className="mt-8 inline-flex items-center gap-3 text-[2rem] font-semibold tracking-tight">
              <span className="h-3 w-3 rounded-full bg-[#22a56a]" />
              <span>Passport</span>
            </div>

            <p className="mt-5 text-sm uppercase tracking-[0.28em] text-[#667084]">
              © 2026 Passport. The peer referral network.
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}

function AudienceEntryCard({
  icon: Icon,
  title,
  description,
  cta,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
  to: "/refer" | "/candidate";
}) {
  return (
    <Card className="rounded-[1.6rem] border border-[#dbe2e7] bg-white p-6 text-left shadow-none">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef9f3] text-[#22a56a]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-[1.9rem] font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-lg leading-8 text-[#697386]">{description}</p>
      <Link
        to={to}
        className="mt-6 inline-flex items-center text-base font-medium text-[#22a56a] transition-colors hover:text-[#1d905d]"
      >
        {cta}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Card>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-[1.6rem] border border-[#dbe2e7] bg-white p-7 shadow-none">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef9f3] text-[#22a56a]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-[2rem] font-semibold leading-tight tracking-tight">{title}</h3>
          <p className="mt-3 text-lg leading-8 text-[#697386]">{description}</p>
        </div>
      </div>
    </Card>
  );
}
