/**
 * scraperService.ts
 * Llama a la API Route interna /api/books/search, que hace el proxy
 * server-side al scrapper (scrapperbooks.railway.internal).
 * Esto evita el Mixed Content error (http desde una página https).
 */

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
    const url = `/api/books/search?q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      try {
        const err = await res.json();
        const msg =
          typeof err?.detail === "string"
            ? err.detail
            : err.detail?.[0]?.msg ?? `Error ${res.status}`;
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
        ? "No se pudo conectar con el scrapper."
        : "Error inesperado al buscar libros.";
    return { ok: false, message: msg };
  }
}
