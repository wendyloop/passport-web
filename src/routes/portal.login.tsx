import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPortalHome } from "@/lib/portal-data";
import { usePortalAuth } from "@/lib/portal-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/login")({
  head: () => ({
    meta: [{ title: "Portal Sign In" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: PortalLoginRoute,
});

function PortalLoginRoute() {
  const navigate = useNavigate();
  const { loading, session, role, requestMagicLink } = usePortalAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    if (!loading && session && role) {
      void navigate({ to: getPortalHome(role), replace: true });
    }
  }, [loading, navigate, role, session]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);

    try {
      await requestMagicLink(email.trim());
      setLinkSent(true);
      toast.success("Check your email for the portal sign-in link.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the sign-in link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg border-border/60 bg-background/60 p-8 shadow-2xl backdrop-blur">
      <h2 className="text-2xl font-semibold tracking-tight">Portal sign in</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Enter the email tied to your admin or employer access. We’ll send a one-time sign-in link.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="portal-email">Work email</Label>
          <Input
            id="portal-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            required
          />
        </div>
        <Button type="submit" disabled={sending} className="w-full">
          {sending ? "Sending magic link…" : "Email me a sign-in link"}
        </Button>
      </form>

      {linkSent ? (
        <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          Magic link sent. Open the email on this device to land in the private portal.
        </div>
      ) : null}
    </Card>
  );
}
