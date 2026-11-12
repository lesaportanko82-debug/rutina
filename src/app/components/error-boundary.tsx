import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Attempt soft reload to dashboard
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "#FAF8F5",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Emoji icon */}
          <div
            style={{
              fontSize: "3.5rem",
              marginBottom: "1.25rem",
              filter: "grayscale(0.2)",
            }}
          >
            🌿
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#4A4540",
              marginBottom: "0.5rem",
              textAlign: "center",
            }}
          >
            Что-то пошло не так
          </h1>

          {/* Message */}
          <p
            style={{
              fontSize: "0.9rem",
              color: "#9B9489",
              textAlign: "center",
              maxWidth: "300px",
              marginBottom: "1.75rem",
              lineHeight: 1.6,
            }}
          >
            Листик столкнулся с неожиданной ошибкой. Попробуйте вернуться на
            главный экран — всё должно быть хорошо 🌱
          </p>

          {/* Error details (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                marginBottom: "1.5rem",
                maxWidth: "360px",
                width: "100%",
                background: "#F5F0E8",
                border: "1px solid #E8E3DC",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                cursor: "pointer",
              }}
            >
              <summary
                style={{
                  fontSize: "0.78rem",
                  color: "#C4876C",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                Детали ошибки (DEV)
              </summary>
              <pre
                style={{
                  fontSize: "0.72rem",
                  color: "#9B9489",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  margin: 0,
                }}
              >
                {this.state.error.toString()}
                {"\n\n"}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          {/* Reset button */}
          <button
            onClick={this.handleReset}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "999px",
              border: "none",
              background: "linear-gradient(135deg, #8DB596, #7BAFB0)",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(141,181,150,0.3)",
            }}
          >
            На главный экран
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
