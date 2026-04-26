"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getReadingBooks,
  saveProgress,
  finishBook as finishBookService,
  addBookFromScrapper,
  BookWithEntry,
  ScrapperBookPayload,
} from "@/lib/bookService";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────────
// Tipo público que usa la UI
// ─────────────────────────────────────────────
export type Book = BookWithEntry & {
  finished: boolean; // alias de status === "finished"
};

interface BooksContextType {
  books: Book[];
  loading: boolean;
  error: string | null;
  progressVersion: number; // incrementa cada vez que se guarda progreso
  updateProgress: (entryId: string, newPage: number, previousPage: number) => Promise<void>;
  finishBook: (entryId: string, totalPages: number) => Promise<void>;
  addFromScrapper: (payload: ScrapperBookPayload) => Promise<void>;
  reload: () => Promise<void>;
}

const BooksContext = createContext<BooksContextType>({
  books: [],
  loading: true,
  error: null,
  progressVersion: 0,
  updateProgress: async () => {},
  finishBook: async () => {},
  addFromScrapper: async () => {},
  reload: async () => {},
});

function toBook(entry: BookWithEntry): Book {
  return { ...entry, finished: entry.status === "finished" };
}

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressVersion, setProgressVersion] = useState(0);
  const { user } = useAuth();

  const reload = useCallback(async () => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getReadingBooks();
      setBooks(data.map(toBook));
    } catch (e) {
      setError("No se pudieron cargar los libros.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateProgress = async (
    entryId: string,
    newPage: number,
    previousPage: number
  ) => {
    // Optimistic update
    setBooks((prev) =>
      prev.map((b) =>
        b.entryId === entryId ? { ...b, currentPage: newPage } : b
      )
    );
    try {
      await saveProgress(entryId, newPage, previousPage);
      setProgressVersion((v) => v + 1); // dispara re-fetch del heatmap
    } catch (e) {
      console.error(e);
      await reload(); // revert on error
    }
  };

  const finishBook = async (entryId: string, totalPages: number) => {
    // Optimistic update
    setBooks((prev) =>
      prev.map((b) =>
        b.entryId === entryId
          ? { ...b, currentPage: totalPages, status: "finished", finished: true }
          : b
      )
    );
    try {
      await finishBookService(entryId, totalPages);
      setProgressVersion((v) => v + 1); // también cuenta como progreso
    } catch (e) {
      console.error(e);
      await reload();
    }
  };

  const addFromScrapper = async (payload: ScrapperBookPayload) => {
    const newEntry = await addBookFromScrapper(payload);
    setBooks((prev) => [toBook(newEntry), ...prev]);
  };

  return (
    <BooksContext.Provider
      value={{ books, loading, error, progressVersion, updateProgress, finishBook, addFromScrapper, reload }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  return useContext(BooksContext);
}
