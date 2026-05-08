import { Link, useRouterState } from "@tanstack/react-router";
import { Brain, Database, LineChart, LogOut, Search, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePortalAuth } from "@/lib/portal-auth";

export function TalentFrame({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { profile, role, signOut } = usePortalAuth();

  return (
    <main className="font-public-sans min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <Card className="sticky top-6 overflow-hidden border-border p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-accent p-3 text-primary">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="font-public-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Hidden workspace
                </p>
                <h1 className="mt-2 text-xl tracking-tight">Talent GPT</h1>
              </div>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Resume-native candidate search, CRM, and recruiter insights built on your private
              network.
            </p>

            <nav className="mt-8 space-y-2">
              <TalentNavLink
                to="/talent/search"
                currentPath={pathname}
                icon={Search}
                label="Search"
              />
              <TalentNavLink
                to="/talent/insights"
                currentPath={pathname}
                icon={LineChart}
                label="Insights"
              />
              {role === "admin" ? (
                <TalentNavLink
                  to="/talent/import"
                  currentPath={pathname}
                  icon={UploadCloud}
                  label="Import resumes"
                />
              ) : null}
              <TalentNavLink
                to="/portal"
                currentPath={pathname}
                icon={Database}
                label="Portal home"
              />
            </nav>

            <div className="mt-8 rounded-2xl border border-border bg-muted/35 p-4">
              <p className="text-sm font-medium">
                {profile?.full_name || profile?.email || "Portal user"}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {role}
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full justify-start"
                onClick={() => {
                  void signOut();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </Card>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <Card className="border-border p-6">
            <p className="font-public-mono text-xs uppercase tracking-[0.32em] text-primary/80">
              Private talent graph
            </p>
            <h2 className="mt-3 text-3xl tracking-tight">{title}</h2>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
          </Card>
          {children}
        </div>
      </div>
    </main>
  );
}

function TalentNavLink({
  to,
  currentPath,
  icon: Icon,
  label,
}: {
  to: "/talent/search" | "/talent/insights" | "/talent/import" | "/portal";
  currentPath: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  const active =
    to === "/portal"
      ? currentPath === "/portal"
      : currentPath === to || currentPath.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
