import { useState, type FormEvent, type ReactNode } from "react";

// Only a salted PBKDF2 hash is stored here — never the password itself.
const SALT = "fb43f58d13cc8eac6ddb90e06288d8ce";
const HASH = "05d3064d50de27b94b1eae45391d0119ae41ed46a3bec44b708fe85c937385cb";
const ITERATIONS = 200_000;
const STORAGE_KEY = "portfolio-unlocked";

const toBytes = (hex: string) =>
  new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));

async function derive(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: toBytes(SALT), iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readUnlocked() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === HASH;
  } catch {
    return false;
  }
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(readUnlocked);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  if (unlocked) return <>{children}</>;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      if ((await derive(value)) === HASH) {
        try {
          sessionStorage.setItem(STORAGE_KEY, HASH);
        } catch {
          /* storage unavailable — stay unlocked for this page view only */
        }
        setUnlocked(true);
        return;
      }
    } catch {
      /* fall through to error */
    }
    setError(true);
    setBusy(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{ width: "100%", maxWidth: 360, display: "grid", gap: 16 }}
      >
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, margin: 0 }}>
          Private portfolio
        </h1>
        <p style={{ margin: 0, color: "var(--color-muted)", fontSize: 15 }}>
          Enter the password to continue.
        </p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          aria-label="Password"
          aria-invalid={error}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          style={{
            padding: "12px 14px",
            borderRadius: 8,
            border: `1px solid ${error ? "#ff5c5c" : "var(--color-border)"}`,
            background: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: 16,
            outline: "none",
          }}
        />
        {error && (
          <span role="alert" style={{ color: "#ff5c5c", fontSize: 14 }}>
            Incorrect password.
          </span>
        )}
        <button
          type="submit"
          disabled={busy || !value}
          style={{
            padding: "12px 14px",
            borderRadius: 8,
            border: "none",
            background: "var(--color-accent)",
            color: "#050505",
            fontWeight: 600,
            fontSize: 16,
            cursor: busy || !value ? "default" : "pointer",
            opacity: busy || !value ? 0.6 : 1,
          }}
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
