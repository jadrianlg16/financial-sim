import { Component } from 'react';

/**
 * Renders `fallback({ error, retry })` instead of letting a render error in its
 * children unmount the whole app. `retry` clears the error and renders the
 * children again.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return this.props.fallback({ error, retry: () => this.setState({ error: null }) });
  }
}
