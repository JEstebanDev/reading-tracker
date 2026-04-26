"use client";

import { useEffect, useRef, useState } from "react";
import { useBooks, Book } from "@/context/BooksContext";
import { supabase } from "@/lib/supabase";

interface ProgressModalProps {
  book: Book;
  onClose: () => void;
}

export default function ProgressModal({ book, onClose }: ProgressModalProps) {
  const { updateProgress, finishBook, reload } = useBooks();
  const [page, setPage] = useState(book.currentPage);
  const [saved, setSaved] = useState(false);
  const [finished, setFinished] = useState(false);
  const [totalPages, setTotalPages] = useState(book.totalPages);
  const [editingTotal, setEditingTotal] = useState(book.totalPages === 0);
  const [totalInput, setTotalInput] = useState(
    book.totalPages > 0 ? String(book.totalPages) : ""
  );
  const [savingTotal, setSavingTotal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const knownTotal = totalPages > 0;
  const progress = knownTotal ? Math.round((page / totalPages) * 100) : 0;
  const pagesLeft = knownTotal ? totalPages - page : null;
  const isLastPage = knownTotal && page >= totalPages;

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSaveTotal = async () => {
    const val = parseInt(totalInput, 10);
    if (isNaN(val) || val <= 0) return;
    setSavingTotal(true);
    await supabase.from("books").update({ total_pages: val }).eq("id", book.bookId);
    setTotalPages(val);
    setEditingTotal(false);
    setSavingTotal(false);
    reload();
  };

  const handleSave = () => {
    updateProgress(book.entryId, page, book.currentPage);
    setSaved(true);
    setTimeout(() => onClose(), 900);
  };

  const handleFinish = () => {
    finishBook(book.entryId, totalPages);
    setFinished(true);
    setTimeout(() => onClose(), 1200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return setPage(0);
    setPage(Math.max(0, knownTotal ? Math.min(val, totalPages) : val));
  };

  const adjust = (delta: number) => {
    setPage((p) => Math.max(0, knownTotal ? Math.min(p + delta, totalPages) : p + delta));
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(29,27,32,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-6 pb-4"
          style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
        >
          <div className="flex-1 pr-4">
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-1"
              style={{ color: "var(--color-primary)" }}
            >
              Actualizar progreso
            </p>
            <h2
              className="text-xl font-semibold leading-tight"
              style={{ color: "var(--color-on-surface)" }}
            >
              {book.title}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
              {book.author}
            </p>
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

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">

          {/* ── Set total pages (only when unknown) ── */}
          {editingTotal && (
            <div
              className="flex flex-col gap-3 rounded-xl p-4"
              style={{
                backgroundColor: "var(--color-secondary-container)",
                color: "var(--color-on-secondary-container)",
              }}
            >
              <p className="text-sm font-semibold">
                ¿Cuántas páginas tiene este libro?
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="ej. 320"
                  value={totalInput}
                  onChange={(e) => setTotalInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTotal()}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-semibold outline-none"
                  style={{
                    borderColor: "var(--color-outline-variant)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-on-surface)",
                  }}
                />
                <button
                  onClick={handleSaveTotal}
                  disabled={savingTotal}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-on-primary)",
                  }}
                >
                  {savingTotal ? "…" : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {/* Page input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Página actual
              </label>
              {knownTotal && !editingTotal && (
                <button
                  onClick={() => setEditingTotal(true)}
                  className="text-xs underline"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Editar total ({totalPages} págs)
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Minus */}
              <button
                onClick={() => adjust(-1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors font-bold text-lg"
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
                −
              </button>

              {/* Input numérico */}
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="number"
                  min={0}
                  max={knownTotal ? totalPages : undefined}
                  value={page}
                  onChange={handleInputChange}
                  className="w-full text-center text-2xl font-semibold rounded-xl border py-3 px-4 outline-none transition-colors"
                  style={{
                    borderColor: "var(--color-outline-variant)",
                    color: "var(--color-on-surface)",
                    backgroundColor: "var(--color-surface-container-low)",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--color-primary)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "var(--color-outline-variant)")
                  }
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {knownTotal ? `/ ${totalPages}` : "págs"}
                </span>
              </div>

              {/* Plus */}
              <button
                onClick={() => adjust(1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors font-bold text-lg"
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
                +
              </button>
            </div>

            {/* Quick +10 / +25 */}
            <div className="flex gap-2 mt-1">
              {[10, 25, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => adjust(n)}
                  className="flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-colors"
                  style={{
                    borderColor: "var(--color-outline-variant)",
                    color: "var(--color-on-surface-variant)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-secondary-container)";
                    e.currentTarget.style.color = "var(--color-on-secondary-container)";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--color-on-surface-variant)";
                    e.currentTarget.style.borderColor = "var(--color-outline-variant)";
                  }}
                >
                  +{n} pág
                </button>
              ))}
            </div>
          </div>

          {/* Barra de progreso viva */}
          {knownTotal && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold tracking-wider uppercase"
                style={{ color: "var(--color-on-surface-variant)" }}>
                <span>{progress}% completado</span>
                <span>{pagesLeft! > 0 ? `${pagesLeft} páginas restantes` : "¡Completado!"}</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--color-surface-variant)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: isLastPage ? "var(--color-tertiary-container)" : "var(--color-primary)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex flex-col gap-3 px-6 pb-6"
        >
          {/* Guardar progreso */}
          {!saved && !finished && (
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary)",
              }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                bookmark_added
              </span>
              Guardar progreso
            </button>
          )}

          {/* Feedback guardado */}
          {saved && (
            <div
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
              style={{
                backgroundColor: "var(--color-secondary-container)",
                color: "var(--color-on-secondary-container)",
              }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              ¡Progreso guardado!
            </div>
          )}

          {/* He terminado este libro */}
          {!finished && !saved && knownTotal && (
            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold border transition-colors"
              style={{
                borderColor: "var(--color-tertiary-container)",
                color: "var(--color-tertiary)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-tertiary-fixed)";
                e.currentTarget.style.borderColor = "var(--color-tertiary-fixed)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "var(--color-tertiary-container)";
              }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                menu_book
              </span>
              He terminado este libro 🎉
            </button>
          )}

          {/* Feedback terminado */}
          {finished && (
            <div
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
              style={{
                backgroundColor: "var(--color-tertiary-fixed)",
                color: "var(--color-on-tertiary-fixed)",
              }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_stories
              </span>
              ¡Felicitaciones! Libro completado 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
