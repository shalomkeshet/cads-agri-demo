import React from "react";

type Props = {
  children: React.ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fff7ed",
            color: "#7c2d12",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {this.props.title || "Something went wrong"}
          </h3>
          <div style={{ fontSize: 13 }}>
            The page crashed during rendering. Check console logs.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
