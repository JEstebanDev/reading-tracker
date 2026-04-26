"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { searchBooks, ScraperBook } from "@/lib/scraperService";
import { useBooks } from "@/context/BooksContext";

interface AddBookModalProps {
  onClose: () => void;
}

type Step = "search" | "confirm" | "saving" | "done" | "error";

export default function AddBookModal({ onClose }: AddBookModalProps) {
  const { addFromScrapper } = useBooks();

  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScraperBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScraperBook | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus al abrir
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Escape cierra
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Búsqueda con debounce (500ms)
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearchError(null);
      return;
    }
    setSearching(true);
    setSearchError(null);
    const result = await searchBooks(q);
    setSearching(false);
    if (result.ok) {
      setResults(result.books);
      if (result.books.length === 0) setSearchError("Sin resultados. Intenta con otro título.");
    } else {
      setSearchError(result.message);
      setResults([]);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      runSearch(query);
    }
  };

  const handleSelect = (book: ScraperBook) => {
    setSelected(book);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setStep("saving");
    setSaveError(null);
    try {
      await addFromScrapper({
        title: selected.title,
        author: selected.authors.join(", "),
        cover_url: selected.cover,
        description: selected.description,
        // total_pages no viene del scrapper — lo puede editar el usuario después
      });
      setStep("done");
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      console.error(e);
      setSaveError("No se pudo guardar el libro. Intenta de nuevo.");
      setStep("error");
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(29,27,32,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: "var(--color-surface-container-lowest)",
          maxHeight: "90vh",
        }}
      >
        {/* ── HEADER ── */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
        >
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-0.5"
              style={{ color: "var(--color-primary)" }}
            >
              Nueva lectura
            </p>
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--color-on-surface)" }}
            >
              {step === "confirm" ? "Confirmar libro" : "Buscar libro"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: "var(--color-on-surface-variant)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--color-surface-variant)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* ── STEP: SEARCH ── */}
        {(step === "search" || step === "confirm") && step === "search" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Input */}
            <div className="px-6 pt-5 pb-3">
              <div
                className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
                style={{
                  borderColor: "var(--color-outline-variant)",
                  backgroundColor: "var(--color-surface-container-low)",
                }}
              >
                {searching ? (
                  <span
                    className="material-symbols-outlined text-xl animate-spin"
                    style={{ color: "var(--color-primary)" }}
                  >
                    progress_activity
                  </span>
                ) : (
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    search
                  </span>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Título del libro, autor…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
                  style={{ color: "var(--color-on-surface)" }}
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      setSearchError(null);
                      inputRef.current?.focus();
                    }}
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    <span className="material-symbols-outlined text-lg">cancel</span>
                  </button>
                )}
              </div>

              {/* Error de búsqueda */}
              {searchError && (
                <p
                  className="mt-2 text-xs font-medium flex items-center gap-1"
                  style={{ color: "var(--color-error)" }}
                >
                  <span className="material-symbols-outlined text-sm">error</span>
                  {searchError}
                </p>
              )}
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
              {results.length === 0 && !searching && !searchError && (
                <div
                  className="flex flex-col items-center gap-3 py-12 text-center"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  <span
                    className="material-symbols-outlined text-5xl opacity-30"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_stories
                  </span>
                  <p className="text-sm">
                    Escribe el título del libro para buscarlo
                  </p>
                </div>
              )}

              {results.map((book, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(book)}
                  className="flex items-start gap-4 rounded-xl border p-3 text-left w-full transition-colors"
                  style={{
                    borderColor: "var(--color-outline-variant)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  {/* Portada */}
                  <div
                    className="relative w-12 h-16 rounded-md overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: "var(--color-surface-variant)" }}
                  >
                    {book.cover ? (
                      <Image
                        src={book.cover}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span
                          className="material-symbols-outlined text-2xl opacity-30"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          menu_book
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm leading-tight line-clamp-2"
                      style={{ color: "var(--color-on-surface)" }}
                    >
                      {book.title}
                    </p>
                    {book.authors?.length > 0 && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {book.authors.join(", ")}
                      </p>
                    )}
                    {book.description && (
                      <p
                        className="text-xs mt-1 line-clamp-2 opacity-70"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {book.description}
                      </p>
                    )}
                  </div>

                  <span
                    className="material-symbols-outlined text-xl flex-shrink-0 self-center"
                    style={{ color: "var(--color-outline-variant)" }}
                  >
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: CONFIRM ── */}
        {step === "confirm" && selected && (
          <div className="flex flex-col gap-6 p-6">
            {/* Preview grande */}
            <div className="flex gap-5">
              <div
                className="relative w-24 h-36 rounded-xl overflow-hidden flex-shrink-0"
                style={{ backgroundColor: "var(--color-surface-variant)" }}
              >
                {selected.cover ? (
                  <Image
                    src={selected.cover}
                    alt={selected.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-3xl opacity-30"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      menu_book
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center gap-1">
                <p
                  className="font-semibold text-lg leading-snug"
                  style={{ color: "var(--color-on-surface)" }}
                >
                  {selected.title}
                </p>
                {selected.authors?.length > 0 && (
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    {selected.authors.join(", ")}
                  </p>
                )}
                {selected.description && (
                  <p
                    className="text-xs mt-1 line-clamp-3 opacity-70"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    {selected.description}
                  </p>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("search")}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors"
                style={{
                  borderColor: "var(--color-outline-variant)",
                  color: "var(--color-on-surface)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--color-surface-variant)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Volver
              </button>

              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                }}
              >
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  add_circle
                </span>
                Agregar a mi lista
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: SAVING ── */}
        {step === "saving" && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
            <span
              className="material-symbols-outlined text-5xl animate-spin"
              style={{ color: "var(--color-primary)" }}
            >
              progress_activity
            </span>
            <p className="text-sm font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
              Guardando libro…
            </p>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
            <span
              className="material-symbols-outlined text-5xl"
              style={{ color: "var(--color-primary)", fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <p className="text-base font-semibold" style={{ color: "var(--color-on-surface)" }}>
              ¡Libro agregado! 📚
            </p>
          </div>
        )}

        {/* ── STEP: ERROR ── */}
        {step === "error" && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 px-6">
            <span
              className="material-symbols-outlined text-5xl"
              style={{ color: "var(--color-error)", fontVariationSettings: "'FILL' 1" }}
            >
              error
            </span>
            <p className="text-sm font-medium text-center" style={{ color: "var(--color-on-surface)" }}>
              {saveError}
            </p>
            <button
              onClick={() => setStep("confirm")}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary)",
              }}
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
