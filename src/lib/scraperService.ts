/**
 * scraperService.ts
 * Conecta con la API scrapper local para buscar libros.
 */

const SCRAPER_BASE_URL = process.env.NEXT_PUBLIC_SCRAPER_URL ?? "http://localhost:8000";

export interface ScraperBook {
  title: string;
  description: string;
  authors: string[];
  cover: string;
}

export interface ScraperError {
  detail: { loc: (string | number)[]; msg: string; type: string }[];
}

export type ScraperResult =
  | { ok: true; books: ScraperBook[] }
  | { ok: false; message: string };

export async function searchBooks(query: string): Promise<ScraperResult> {
  if (!query.trim()) return { ok: true, books: [] };

  try {
    const url = `${SCRAPER_BASE_URL}/books/search?q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      // No cache — siempre fresco del scrapper
      cache: "no-store",
    });

    if (!res.ok) {
      // Intenta parsear el error del scrapper
      try {
        const err: ScraperError = await res.json();
        const msg = err.detail?.[0]?.msg ?? `Error ${res.status}`;
        return { ok: false, message: msg };
      } catch {
        return { ok: false, message: `Error ${res.status}: ${res.statusText}` };
      }
    }

    const books: ScraperBook[] = await res.json();
    return { ok: true, books };
  } catch (e) {
    const msg =
      e instanceof TypeError && e.message.includes("fetch")
        ? "No se pudo conectar con el scrapper. ¿Está corriendo en localhost:8000?"
        : "Error inesperado al buscar libros.";
    return { ok: false, message: msg };
  }
}
