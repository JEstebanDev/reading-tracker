"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Mode = "password" | "magic-link" | "check-inbox";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);
    if (error) setError("Correo o contraseña incorrectos.");
    // Si es exitoso, AuthContext detecta la sesión y redirige automáticamente
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMode("check-inbox");
    }
  }

  const inputStyle = {
    backgroundColor: "var(--color-surface-container-lowest)",
    borderColor: "var(--color-outline-variant)",
    color: "var(--color-on-surface)",
  };

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = "var(--color-primary)";
      e.currentTarget.style.boxShadow =
        "0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = "var(--color-outline-variant)";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div className="w-full max-w-md px-6">
        {/* Brand */}
        <div className="text-center mb-10">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            Libris
          </p>
          <h1
            className="text-4xl font-semibold tracking-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "var(--color-on-surface)",
            }}
          >
            {mode === "check-inbox" ? "Revisa tu correo" : "Bienvenido"}
          </h1>
          <p className="mt-3 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            {mode === "check-inbox"
              ? `Enviamos un enlace mágico a ${email}.`
              : "Accede a tu biblioteca personal."}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: "var(--color-surface-container-low)",
            borderColor: "var(--color-outline-variant)",
          }}
        >
          {/* ── Check inbox ── */}
          {mode === "check-inbox" && (
            <div className="flex flex-col items-center gap-6 text-center py-2">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-secondary-container)" }}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{
                    color: "var(--color-on-secondary-container)",
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  mark_email_read
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                Revisa tu bandeja (y spam) en{" "}
                <span className="font-medium" style={{ color: "var(--color-primary)" }}>
                  {email}
                </span>
              </p>
              <button
                onClick={() => { setMode("password"); setError(null); }}
                className="text-sm font-medium underline underline-offset-2"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* ── Contraseña ── */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium" style={{ color: "var(--color-on-surface)" }}>
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
                  style={inputStyle}
                  {...focusHandlers}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium" style={{ color: "var(--color-on-surface)" }}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all"
                    style={inputStyle}
                    {...focusHandlers}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
                  style={{
                    borderColor: "var(--color-error)",
                    backgroundColor: "var(--color-error-container)",
                    color: "var(--color-on-error-container)",
                  }}
                >
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
              >
                {loading ? (
                  <>
                    <span
                      className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: "var(--color-on-primary)", borderTopColor: "transparent" }}
                    />
                    Entrando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">login</span>
                    Entrar
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setMode("magic-link"); setError(null); }}
                className="text-center text-xs underline underline-offset-2"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Prefiero recibir un enlace mágico por correo
              </button>
            </form>
          )}

          {/* ── Magic Link ── */}
          {mode === "magic-link" && (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email-otp" className="text-sm font-medium" style={{ color: "var(--color-on-surface)" }}>
                  Correo electrónico
                </label>
                <input
                  id="email-otp"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
                  style={inputStyle}
                  {...focusHandlers}
                />
              </div>

              {error && (
                <div
                  className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
                  style={{
                    borderColor: "var(--color-error)",
                    backgroundColor: "var(--color-error-container)",
                    color: "var(--color-on-error-container)",
                  }}
                >
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
              >
                {loading ? (
                  <>
                    <span
                      className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: "var(--color-on-primary)", borderTopColor: "transparent" }}
                    />
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">send</span>
                    Enviar enlace mágico
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setMode("password"); setError(null); }}
                className="text-center text-xs underline underline-offset-2"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Volver a iniciar con contraseña
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--color-outline)" }}>
          Libris · Tu biblioteca personal
        </p>
      </div>
    </div>
  );
}
