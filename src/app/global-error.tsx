"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
          background: "#F4F7F2",
          color: "#1B4332"
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center"
          }}
        >
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Something went wrong</h1>
          <p style={{ maxWidth: "28rem", color: "#3d5c4e", margin: 0 }}>
            Your previous sign-in may be out of date. Start fresh to keep using PrepCourt — no need
            to clear cookies manually.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: "1px solid #c5d5c8",
                background: "#fff",
                color: "#1B4332",
                borderRadius: "0.75rem",
                padding: "0.5rem 1rem"
              }}
            >
              Try again
            </button>
            <a
              href="/auth/recover"
              style={{
                background: "#2D6A4F",
                color: "#F4F7F2",
                borderRadius: "0.75rem",
                padding: "0.5rem 1rem",
                textDecoration: "none"
              }}
            >
              Sign in again
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
