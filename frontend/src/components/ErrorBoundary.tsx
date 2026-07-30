import { Component, type ErrorInfo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// Class components can't call hooks directly, so the translated fallback UI
// is split into its own function component and rendered from `render()` below.
function ErrorFallback() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card/70 p-8 text-center shadow-lg backdrop-blur-xl dark:bg-card/50">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="font-heading text-lg font-semibold">{t("Something went wrong")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("An unexpected error occurred. Reloading the page usually fixes it.")}
        </p>
        <Button className="mt-6 w-full" onClick={() => window.location.reload()}>
          <RotateCw className="size-4" />
          {t("Reload page")}
        </Button>
      </div>
    </div>
  )
}

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Class-based React error boundary that wraps `children` and catches any
 * unhandled render/lifecycle errors thrown beneath it in the tree. Once
 * tripped, it permanently swaps the subtree for a full-screen "Something
 * went wrong" fallback with a reload button — there is no retry-without-
 * reload path, since React error boundaries don't support silently
 * un-tripping themselves. Errors are logged to the console for debugging.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  // React lifecycle hook: called during render when a descendant throws.
  // Returning new state here triggers the fallback UI on the next render.
  static getDerivedStateFromError() {
    return { hasError: true }
  }

  // React lifecycle hook: called after an error is caught, used only for
  // side effects (logging) since state is already updated above.
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error caught by ErrorBoundary:", error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return <ErrorFallback />
  }
}
