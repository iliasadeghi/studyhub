import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('StudyHub crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center"
      >
        <div className="grid h-16 w-16 place-items-center rounded-xl bg-danger-soft text-danger-text">
          <AlertTriangle className="h-8 w-8" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-1 text-sm text-muted">
            This page hit an unexpected error. Your data is safe — try again, or head back home.
          </p>
          <pre className="mt-3 max-h-24 overflow-auto rounded-md bg-surface-2 p-2 text-left text-xs text-muted">
            {this.state.error.message}
          </pre>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => (window.location.href = import.meta.env.BASE_URL)}
          >
            Go home
          </Button>
          <Button
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }
}
