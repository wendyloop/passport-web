import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePortalAuth } from "@/lib/portal-auth";

export function PortalFrame({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isLoginRoute = pathname.endsWith("/portal/login") || pathname.endsWith("/portal/login/");
  const { role, profile, signOut } = usePortalAuth();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(214,255,94,0.18),_transparent_30%),linear-gradient(180deg,_rgba(11,10,20,1),_rgba(24,20,43,1))] text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-primary/80">Passport Portal</p>
            {title ? <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1> : null}
            {subtitle ? (
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {!isLoginRoute && role ? (
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="border border-border/70 bg-background/50 px-3 py-1"
              >
                {role}
              </Badge>
              {profile?.full_name ? (
                <span className="text-sm text-muted-foreground">{profile.full_name}</span>
              ) : null}
              <Button
                variant="outline"
                onClick={() => {
                  void signOut();
                }}
              >
                Sign out
              </Button>
            </div>
          ) : null}
        </div>
        {!isLoginRoute && role ? (
          <div className="mb-6 flex flex-wrap gap-3">
            {role === "admin" ? (
              <Button asChild variant="secondary">
                <Link to="/portal/admin">Admin</Link>
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link to="/portal/employers">Employer Feed</Link>
              </Button>
            )}
          </div>
        ) : null}
        <div>{children}</div>
      </div>
    </main>
  );
}

export function PortalLoadingCard({ label = "Loading portal…" }: { label?: string }) {
  return (
    <Card className="mx-auto max-w-xl border-border/60 bg-background/60 p-8 text-center shadow-2xl backdrop-blur">
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

export function PortalAccessDenied({ title, message }: { title: string; message: string }) {
  const { signOut } = usePortalAuth();

  return (
    <Card className="mx-auto max-w-xl border-border/60 bg-background/60 p-8 shadow-2xl backdrop-blur">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      <div className="mt-6">
        <Button
          variant="outline"
          onClick={() => {
            void signOut();
          }}
        >
          Sign out
        </Button>
      </div>
    </Card>
  );
}
