import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { AuthProvider } from "@/context/AuthContext"
import { ThemeProvider } from "@/context/ThemeContext"
import "./i18n"
import "./index.css"
import App from "./App.tsx"

// Single shared TanStack Query client for the whole app. Queries retry once
// on failure and don't auto-refetch just because the browser tab regained
// focus (avoids surprising background requests/flicker while navigating).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// App entry point. Provider order (outer to inner) matters:
// ThemeProvider (needs no other context) -> ErrorBoundary (catches render
// errors from everything below) -> QueryClientProvider (data fetching) ->
// BrowserRouter (routing) -> AuthProvider (depends on QueryClient for
// caching the session, and is read by route guards) -> TooltipProvider (UI)
// -> the actual App routes, plus a global Toaster for notifications.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <TooltipProvider>
                <App />
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
)
