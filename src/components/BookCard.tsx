"use client";

import Image from "next/image";
import { useState } from "react";
import { Book } from "@/context/BooksContext";
import ProgressModal from "@/components/ProgressModal";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const knownTotal = book.totalPages > 0;
  const progress = book.finished
    ? 100
    : knownTotal
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <>
      <article
        className="group flex flex-col gap-3 rounded-xl border p-3 transition-colors duration-300"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: book.finished
            ? "var(--color-tertiary-container)"
            : "var(--color-outline-variant)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--color-surface-container)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--color-surface)")
        }
      >
        {/* Cover */}
        <div
          className="relative aspect-[2/3] w-full overflow-hidden rounded-lg"
          style={{ backgroundColor: "var(--color-surface-variant)" }}
        >
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover mix-blend-multiply"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
          {/* Badge */}
          <div
            className="absolute right-2 top-2 rounded px-2 py-0.5 text-xs font-semibold tracking-wide uppercase backdrop-blur-sm"
            style={{
              backgroundColor: book.finished
                ? "var(--color-tertiary-fixed)"
                : "rgba(255,252,248,0.92)",
              color: book.finished
                ? "var(--color-on-tertiary-fixed)"
                : "var(--color-on-surface)",
            }}
          >
            {book.finished ? "✓ Listo" : knownTotal ? `${progress}%` : "—"}
          </div>
        </div>

        {/* Info */}
        <div>
          <h3
            className="mb-0.5 text-base font-medium leading-tight"
            style={{ color: "var(--color-on-surface)" }}
          >
            {book.title}
          </h3>
          <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
            {book.author}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-auto flex flex-col gap-1.5">
          <div
            className="h-1 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--color-surface-variant)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: book.finished
                  ? "var(--color-tertiary-container)"
                  : "var(--color-primary)",
              }}
            />
          </div>
          <p
            className="text-right text-xs font-semibold tracking-wider uppercase"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            {knownTotal ? `${book.currentPage} / ${book.totalPages} pág` : `pág ${book.currentPage}`}
          </p>

          {/* Botón Agregar progreso */}
          {!book.finished && (
            <button
              onClick={() => setModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold border transition-colors"
              style={{
                borderColor: "var(--color-outline-variant)",
                color: "var(--color-primary)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-secondary-container)";
                e.currentTarget.style.borderColor = "transparent";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "var(--color-outline-variant)";
              }}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                edit_note
              </span>
              Agregar progreso
            </button>
          )}

          {/* Badge libro terminado */}
          {book.finished && (
            <div
              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: "var(--color-tertiary-fixed)",
                color: "var(--color-on-tertiary-fixed)",
              }}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_stories
              </span>
              Libro completado 🎉
            </div>
          )}
        </div>
      </article>

      {/* Modal */}
      {modalOpen && (
        <ProgressModal book={book} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
