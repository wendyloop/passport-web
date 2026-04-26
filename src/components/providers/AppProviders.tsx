import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { PortalAuthProvider } from "@/lib/portal-auth-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PortalAuthProvider>
        {children}
        <Toaster richColors position="top-center" />
      </PortalAuthProvider>
    </QueryClientProvider>
  );
}
