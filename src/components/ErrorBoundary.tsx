import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly message: string;
}

/**
 * [L7] Root React Error Boundary protecting UI & 3D viewport.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Erreur inattendue dans l’interface.' };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Interface ErrorBoundary caught:', error, info.componentStack);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#fff7f9] p-6 text-[#1f1224] dark:bg-[#120916] dark:text-rose-50">
          <div className="exo-bento-card max-w-md rounded-xl p-6">
            <h1 className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">
              Interruption de l&apos;interface
            </h1>
            <p className="mt-2 font-mono text-xs text-rose-900/80 dark:text-rose-200/80">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 min-h-[40px] rounded-lg bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500"
            >
              Réinitialiser l’interface
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
