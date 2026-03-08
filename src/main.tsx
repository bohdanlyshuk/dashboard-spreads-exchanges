import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(e: Error) {
    return { error: e };
  }
  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div style={{ padding: "2rem", color: "#fca5a5", fontFamily: "system-ui", maxWidth: "600px", background: "#1f2937" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>Something went wrong</h2>
          <pre className="overflow-auto custom-scrollbar text-xs">{this.state.error.message}</pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500/30 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = "<p style='padding:2rem;color:#fca5a5;font-family:system-ui'>#root not found</p>";
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
