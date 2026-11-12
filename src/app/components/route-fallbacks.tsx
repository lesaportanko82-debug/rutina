import { useRouteError, useNavigate } from "react-router";

/** Shown while a lazy route chunk is being fetched (hydration fallback). */
export function RouteLoadingFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        background: "transparent",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "2.5px solid rgba(141,181,150,0.25)",
          borderTopColor: "#8DB596",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Shown when a route (including lazy chunk fetch) throws an error. */
export function RouteErrorBoundary() {
  const error = useRouteError() as Error | { message?: string } | null;
  const isChunkError =
    typeof (error as any)?.message === "string" &&
    ((error as any).message.includes("Failed to fetch") ||
      (error as any).message.includes("dynamically imported"));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "2rem",
        background: "#FAF8F5",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌿</div>

      <p
        style={{
          fontSize: "1.05rem",
          fontWeight: 600,
          color: "#4A4540",
          marginBottom: "0.5rem",
        }}
      >
        {isChunkError ? "Не удалось загрузить страницу" : "Что-то пошло не так"}
      </p>

      <p
        style={{
          fontSize: "0.85rem",
          color: "#9B9489",
          maxWidth: 280,
          lineHeight: 1.6,
          marginBottom: "1.75rem",
        }}
      >
        {isChunkError
          ? "Проверьте соединение и попробуйте ещё раз."
          : "Листик столкнулся с неожиданной ошибкой. Обновите страницу 🌱"}
      </p>

      {import.meta.env.DEV && error && (
        <details
          style={{
            marginBottom: "1.5rem",
            maxWidth: 360,
            width: "100%",
            background: "#F5F0E8",
            border: "1px solid #E8E3DC",
            borderRadius: 10,
            padding: "0.75rem 1rem",
            cursor: "pointer",
          }}
        >
          <summary
            style={{ fontSize: "0.78rem", color: "#C4876C", fontWeight: 600 }}
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
            {String((error as any)?.message ?? error)}
          </pre>
        </details>
      )}

      <button
        onClick={() => window.location.href = "/"}
        style={{
          padding: "0.7rem 2rem",
          borderRadius: 999,
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
