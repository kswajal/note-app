import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Refresh the page and try again. If it keeps happening, check the console for the full error.
            </p>
            {this.state.error ? (
              <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-red-300">
                {this.state.error.toString()}
              </pre>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
