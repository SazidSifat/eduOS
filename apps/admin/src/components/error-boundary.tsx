import { Component, type ErrorInfo, type ReactNode } from 'react';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Connect a redacted error reporter before production rollout. */
  }
  override render() {
    return this.state.failed ? (
      <main role="alert" className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-semibold">EduOS could not load</h1>
        <p className="my-4">Reload to try again.</p>
        <a href="/" className="underline">
          Reload EduOS
        </a>
      </main>
    ) : (
      this.props.children
    );
  }
}
