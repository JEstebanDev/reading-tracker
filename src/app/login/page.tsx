"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthStep = "email" | "check-inbox" | "magic-link-sent";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<AuthStep>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setStep("check-inbox");
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div className="w-full max-w-md px-6">
        {/* Logo / Brand */}
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
            {step === "email" ? "Bienvenido" : "Revisa tu correo"}
          </h1>
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            {step === "email"
              ? "Ingresa tu correo electrónico para acceder a tu biblioteca personal."
              : `Enviamos un enlace mágico a ${email}. Ábrelo para entrar sin contraseña.`}
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
          {step === "email" ? (
            <form onSubmit={handleSendMagicLink} className="flex flex-col gap-5">
              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium"
                  style={{ color: "var(--color-on-surface)" }}
                >
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
                  style={{
                    backgroundColor: "var(--color-surface-container-lowest)",
                    borderColor: "var(--color-outline-variant)",
                    color: "var(--color-on-surface)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-outline-variant)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
                  style={{
                    borderColor: "var(--color-error)",
                    backgroundColor: "var(--color-error-container)",
                    color: "var(--color-on-error-container)",
                  }}
                >
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                }}
              >
                {loading ? (
                  <>
                    <span
                      className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: "var(--color-on-primary)", borderTopColor: "transparent" }}
                    />
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      send
                    </span>
                    Enviar enlace mágico
                  </>
                )}
              </button>

              <p
                className="text-center text-xs"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Sin contraseña — solo un clic en tu correo.
              </p>
            </form>
          ) : (
            /* Check inbox state */
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

              <div>
                <p
                  className="font-semibold text-base mb-1"
                  style={{ color: "var(--color-on-surface)" }}
                >
                  ¡Enlace enviado!
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Revisa tu bandeja de entrada (y la carpeta de spam) en{" "}
                  <span
                    className="font-medium"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {email}
                  </span>
                </p>
              </div>

              <button
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
                className="text-sm font-medium underline underline-offset-2"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Usar otro correo
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--color-outline)" }}
        >
          Libris · Tu biblioteca personal
        </p>
      </div>
    </div>
  );
}
