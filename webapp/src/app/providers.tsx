import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { AppLocaleProvider } from "@/i18n/locale-context";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppLocaleProvider>
          <AuthProvider>
            {children}
            <Toaster
              richColors
              position="top-right"
              closeButton
              toastOptions={{
                className:
                  "!rounded-2xl !border !border-border/80 !shadow-lift !backdrop-blur-md",
                duration: 3200,
              }}
            />
          </AuthProvider>
        </AppLocaleProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
