import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[25rem] w-full items-center justify-center rounded-sheet border border-border bg-bg p-6 text-text">
          <div className="max-w-md text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-surface-2 text-danger">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Something went wrong</h2>
            <p className="text-base text-muted">
              The app could not show this screen. Reload to try again.
            </p>
            <Button
              onClick={this.handleReset}
              variant="primary"
              size="md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
