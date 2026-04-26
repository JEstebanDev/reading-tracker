"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useBooks } from "@/context/BooksContext";
import BookCard from "@/components/BookCard";
import HabitHeatmap from "@/components/HabitHeatmap";
import HeaderActions from "@/components/HeaderActions";
import { getDailyPhrases } from "@/lib/bookService";

const PHRASE_INTERVAL_MS = 6500;

function useDailyPhrase() {
  const [phrases, setPhrases] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    getDailyPhrases().then((data) => {
      if (data.length > 0) setPhrases(data);
    });
  }, []);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const interval = setInterval(() => {
      // Fade out → swap → fade in
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % phrases.length);
        setVisible(true);
      }, 400);
    }, PHRASE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phrases]);

  return { phrase: phrases[index] ?? "Leer 10 minutos hoy es mejor que nada.", visible };
}

function BookCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 rounded-xl border p-4 animate-pulse"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-outline-variant)",
      }}
    >
      <div
        className="aspect-[2/3] w-full rounded-lg"
        style={{ backgroundColor: "var(--color-surface-variant)" }}
      />
      <div className="flex flex-col gap-2">
        <div className="h-4 rounded w-3/4" style={{ backgroundColor: "var(--color-surface-variant)" }} />
        <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--color-surface-variant)" }} />
      </div>
      <div className="mt-auto pt-2 flex flex-col gap-2">
        <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: "var(--color-surface-variant)" }} />
        <div className="h-8 rounded-lg w-full" style={{ backgroundColor: "var(--color-surface-variant)" }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { books, loading, error, reload } = useBooks();
  const { phrase, visible } = useDailyPhrase();

  return (
    <div className="flex-1 w-full flex flex-col relative justify-center">
      <main
        className="flex-1 w-full max-w-[1200px] mx-auto flex flex-col justify-center"
        style={{ padding: "32px", gap: "64px" }}
      >
        {/* Header */}
        <section className="flex flex-col" style={{ gap: "12px" }}>
          {/* Fila 1: Resumen Diario */}
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-1"
              style={{ color: "var(--color-primary)" }}
            >
              Resumen Diario
            </p>
            <h1
              className="text-[2.5rem] font-semibold leading-tight tracking-tight transition-opacity duration-400"
              style={{
                color: "var(--color-on-surface)",
                opacity: visible ? 1 : 0,
              }}
            >
              {phrase}
            </h1>
          </div>
          {/* Fila 2: Acciones */}
          <HeaderActions />
        </section>

        {/* Current Reads */}
        <section>
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: "16px" }}
          >
            <h2
              className="text-[1.75rem] font-medium leading-snug tracking-tight"
              style={{ color: "var(--color-on-surface)" }}
            >
              Lecturas Actuales
            </h2>
            <button
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Ver todo
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div
              className="rounded-xl border p-6 flex items-center gap-3 mb-4"
              style={{
                borderColor: "var(--color-error)",
                backgroundColor: "var(--color-error-container)",
                color: "var(--color-on-error-container)",
              }}
            >
              <span className="material-symbols-outlined">error</span>
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={reload}
                className="ml-auto text-sm font-semibold underline"
              >
                Reintentar
              </button>
            </div>
          )}

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5"
            style={{ gap: "16px" }}
          >
            {loading
              ? [1, 2, 3].map((n) => <BookCardSkeleton key={n} />)
              : books.map((book) => <BookCard key={book.entryId} book={book} />)}
          </div>

          {/* Empty state */}
          {!loading && !error && books.length === 0 && (
            <div
              className="rounded-xl border-2 border-dashed p-12 flex flex-col items-center gap-3 text-center"
              style={{ borderColor: "var(--color-outline-variant)" }}
            >
              <span
                className="material-symbols-outlined text-5xl"
                style={{ color: "var(--color-outline-variant)", fontVariationSettings: "'FILL' 1" }}
              >
                menu_book
              </span>
              <p className="font-semibold text-lg" style={{ color: "var(--color-on-surface)" }}>
                No tienes libros en curso
              </p>
              <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                Agrega un libro para empezar a rastrear tu lectura
              </p>
            </div>
          )}
        </section>

        {/* Heatmap */}
        <HabitHeatmap />
      </main>
    </div>
  );
}
