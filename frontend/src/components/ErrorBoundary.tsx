import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error caught by ErrorBoundary:", error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card/70 p-8 text-center shadow-lg backdrop-blur-xl dark:bg-card/50">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <h1 className="font-heading text-lg font-semibold">Something went wrong</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            An unexpected error occurred. Reloading the page usually fixes it.
          </p>
          <Button className="mt-6 w-full" onClick={() => window.location.reload()}>
            <RotateCw className="size-4" />
            Reload page
          </Button>
        </div>
      </div>
    )
  }
}
