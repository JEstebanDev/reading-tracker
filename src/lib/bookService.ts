/**
 * bookService.ts
 * Capa de acceso a datos — toda la lógica de Supabase vive aquí.
 * La UI nunca llama a supabase directamente, siempre pasa por estos servicios.
 */

import { createSupabaseBrowserClient } from "./supabase-browser";

const supabase = createSupabaseBrowserClient();
import type { TablesInsert } from "./database.types";

// ─────────────────────────────────────────────
// TIPOS de dominio que usa la UI
// ─────────────────────────────────────────────
export interface BookWithEntry {
  // de books
  bookId: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number;
  genre: string | null;
  // de reading_entries
  entryId: string;
  currentPage: number;
  status: "reading" | "finished" | "paused" | "abandoned";
  startedAt: string;
  finishedAt: string | null;
}

// ─────────────────────────────────────────────
// GET: lecturas actuales (status = reading)
// ─────────────────────────────────────────────
export async function getReadingBooks(): Promise<BookWithEntry[]> {
  const { data, error } = await supabase
    .from("reading_entries")
    .select(`
      id,
      current_page,
      status,
      started_at,
      finished_at,
      books (
        id,
        title,
        author,
        cover_url,
        total_pages,
        genre
      )
    `)
    .eq("status", "reading")
    .order("started_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((entry) => {
    const book = entry.books as {
      id: string;
      title: string;
      author: string | null;
      cover_url: string | null;
      total_pages: number | null;
      genre: string | null;
    };
    return {
      bookId: book.id,
      title: book.title,
      author: book.author ?? "",
      coverUrl: book.cover_url ?? "",
      totalPages: book.total_pages ?? 0,
      genre: book.genre,
      entryId: entry.id,
      currentPage: entry.current_page,
      status: entry.status as BookWithEntry["status"],
      startedAt: entry.started_at ?? "",
      finishedAt: entry.finished_at,
    };
  });
}

// ─────────────────────────────────────────────
// POST: guardar progreso (inserta progress_log)
// El trigger de Supabase actualiza current_page y status automáticamente
// ─────────────────────────────────────────────
export async function saveProgress(
  entryId: string,
  pageReached: number,
  previousPage: number
): Promise<void> {
  const pagesRead = Math.max(0, pageReached - previousPage);

  const { error } = await supabase.from("progress_logs").insert({
    reading_entry_id: entryId,
    page_reached: pageReached,
    pages_read: pagesRead,
  });

  if (error) throw error;
}

// ─────────────────────────────────────────────
// POST: marcar libro como terminado
// ─────────────────────────────────────────────
export async function finishBook(entryId: string, totalPages: number): Promise<void> {
  // Insertamos un progress_log con la última página
  // el trigger se encarga de actualizar status → finished
  const { error } = await supabase.from("progress_logs").insert({
    reading_entry_id: entryId,
    page_reached: totalPages,
    pages_read: 0,
  });

  if (error) throw error;
}

// ─────────────────────────────────────────────
// POST: agregar libro desde el scrapper API
// Recibe el resultado del scrapper y lo guarda
// ─────────────────────────────────────────────
export interface ScrapperBookPayload {
  api_id?: string;
  title: string;
  author?: string;
  cover_url?: string;
  description?: string;
  total_pages?: number;
  isbn?: string;
  genre?: string;
  published_year?: number;
  language?: string;
  source_url?: string;
}

export async function addBookFromScrapper(
  payload: ScrapperBookPayload
): Promise<BookWithEntry> {
  // 1. Upsert en books (por api_id si existe, si no inserta nuevo)
  const bookInsert: TablesInsert<"books"> = {
    title: payload.title,
    author: payload.author,
    cover_url: payload.cover_url,
    description: payload.description,
    total_pages: payload.total_pages,
    isbn: payload.isbn,
    genre: payload.genre,
    published_year: payload.published_year,
    language: payload.language ?? "es",
    source_url: payload.source_url,
    api_id: payload.api_id,
  };

  const { data: book, error: bookError } = await supabase
    .from("books")
    .upsert(bookInsert, { onConflict: "api_id", ignoreDuplicates: false })
    .select()
    .single();

  if (bookError) throw bookError;

  // 2. Crear reading_entry para este libro vinculada al usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa");

  const { data: entry, error: entryError } = await supabase
    .from("reading_entries")
    .insert({
      book_id: book.id,
      user_id: user.id,
      current_page: 0,
      status: "reading",
    })
    .select()
    .single();

  if (entryError) throw entryError;

  return {
    bookId: book.id,
    title: book.title,
    author: book.author ?? "",
    coverUrl: book.cover_url ?? "",
    totalPages: book.total_pages ?? 0,
    genre: book.genre,
    entryId: entry.id,
    currentPage: 0,
    status: "reading",
    startedAt: entry.started_at ?? "",
    finishedAt: null,
  };
}

// ─────────────────────────────────────────────
// GET: frases motivacionales del resumen diario
// ─────────────────────────────────────────────
export async function getDailyPhrases(): Promise<string[]> {
  const { data, error } = await supabase
    .from("daily_phrases")
    .select("phrase")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => row.phrase);
}

// ─────────────────────────────────────────────
// GET: historial de progress_logs para el heatmap
// Devuelve los últimos 60 días
// ─────────────────────────────────────────────
export async function getProgressLogs(): Promise<
  { logged_at: string; pages_read: number }[]
> {
  const since = new Date();
  since.setDate(since.getDate() - 60);

  const { data, error } = await supabase
    .from("progress_logs")
    .select("logged_at, pages_read")
    .gte("logged_at", since.toISOString())
    .order("logged_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    logged_at: row.logged_at ?? new Date().toISOString(),
    pages_read: row.pages_read,
  }));
}
