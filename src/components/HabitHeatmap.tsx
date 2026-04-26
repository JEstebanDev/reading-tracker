"use client";

import { useEffect, useState } from "react";
import { getProgressLogs } from "@/lib/bookService";
import { useBooks } from "@/context/BooksContext";

interface HeatmapCell {
  date: string;
  intensity: number; // 0–4
  pages: number;
}

// ── Paleta café ──────────────────────────────
const BROWN = [
  "transparent",          // 0 — sin lectura (borde visible)
  "rgba(139,90,43,0.25)", // 1 — poquito
  "rgba(160,100,40,0.50)", // 2
  "rgba(180,110,35,0.75)", // 3
  "#A0522D",              // 4 — sienna sólido
];

function intensityToColor(intensity: number): string {
  return BROWN[intensity] ?? BROWN[0];
}

function pagesToIntensity(pages: number): number {
  if (pages === 0) return 0;
  if (pages < 10) return 1;
  if (pages < 25) return 2;
  if (pages < 50) return 3;
  return 4;
}

/** 35 días terminando hoy, agrupados en 5 semanas de 7 días */
function buildGrid(
  logs: { logged_at: string; pages_read: number }[]
): HeatmapCell[][] {
  const byDay: Record<string, number> = {};
  for (const log of logs) {
    const day = log.logged_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + log.pages_read;
  }

  const today = new Date();
  const cells: HeatmapCell[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const pages = byDay[key] ?? 0;
    cells.push({ date: key, pages, intensity: pagesToIntensity(pages) });
  }

  // 5 columnas (semanas) × 7 filas (días)
  const weeks: HeatmapCell[][] = [];
  for (let w = 0; w < 5; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }
  return weeks;
}

/**
 * Racha real: cuenta hacia atrás desde ayer (si hoy no has leído aún,
 * la racha no se rompe), o desde hoy si ya leíste hoy.
 */
function calcStreak(logs: { logged_at: string; pages_read: number }[]): number {
  const byDay: Record<string, number> = {};
  for (const log of logs) {
    const day = log.logged_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + log.pages_read;
  }

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const readToday = (byDay[todayKey] ?? 0) > 0;

  // Empezamos a contar desde hoy si leíste, si no desde ayer
  const startOffset = readToday ? 0 : 1;
  let streak = 0;

  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((byDay[key] ?? 0) > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Etiqueta de semana (lunes de esa semana, formato corto) */
function weekLabel(week: HeatmapCell[]): string {
  if (!week[0]) return "";
  const d = new Date(week[0].date + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function HabitHeatmap() {
  const { progressVersion } = useBooks();
  const [weeks, setWeeks] = useState<HeatmapCell[][]>([]);
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{
    date: string;
    pages: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    getProgressLogs()
      .then((logs) => {
        setWeeks(buildGrid(logs));
        setStreak(calcStreak(logs));
        const activeDays = buildGrid(logs).flat().filter((c) => c.pages > 0).length;
        setTotalDays(activeDays);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [progressVersion]); // se re-ejecuta cada vez que se guarda progreso

  return (
    <section
      className="flex flex-col gap-6 rounded-xl border p-6 md:p-8"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-outline-variant)",
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-[1.75rem] font-medium leading-snug tracking-tight"
            style={{ color: "var(--color-on-surface)" }}
          >
            Consistencia de Lectura
          </h2>
          <p className="mt-1 text-base" style={{ color: "var(--color-on-surface-variant)" }}>
            {loading
              ? "Cargando..."
              : streak > 0
              ? `🔥 Racha: ${streak} día${streak === 1 ? "" : "s"} seguido${streak === 1 ? "" : "s"}`
              : "Sin racha activa — ¡lee algo hoy!"}
          </p>
        </div>

        {/* Stat: días activos este mes */}
        {!loading && (
          <div
            className="flex flex-col items-center rounded-xl px-5 py-3 shrink-0"
            style={{ backgroundColor: "var(--color-surface-container-low)" }}
          >
            <span
              className="text-3xl font-bold leading-none"
              style={{ color: "#A0522D" }}
            >
              {totalDays}
            </span>
            <span
              className="text-xs font-semibold tracking-wider uppercase mt-1"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              días / mes
            </span>
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="relative">
        {/* Tooltip flotante */}
        {tooltip && (
          <div
            className="fixed z-50 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xl pointer-events-none"
            style={{
              top: tooltip.y - 40,
              left: tooltip.x,
              transform: "translateX(-50%)",
              backgroundColor: "#3B1F0E",
              color: "#F5DEB3",
              whiteSpace: "nowrap",
            }}
          >
            {new Date(tooltip.date + "T12:00:00").toLocaleDateString("es-ES", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
            {" — "}
            {tooltip.pages > 0 ? `${tooltip.pages} págs` : "sin lectura"}
          </div>
        )}

        {loading ? (
          /* Skeleton */
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, wi) => (
              <div key={wi} className="flex flex-col gap-2 flex-1">
                {Array.from({ length: 7 }).map((_, di) => (
                  <div
                    key={di}
                    className="h-8 rounded-md animate-pulse"
                    style={{ backgroundColor: "var(--color-surface-variant)" }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Etiquetas de semana */}
            <div className="flex gap-3">
              {weeks.map((week, wi) => (
                <div
                  key={wi}
                  className="flex-1 text-center text-[10px] font-semibold tracking-wide uppercase"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {weekLabel(week)}
                </div>
              ))}
            </div>

            {/* Celdas: 7 filas × 5 columnas */}
            {Array.from({ length: 7 }).map((_, di) => (
              <div key={di} className="flex gap-3">
                {weeks.map((week, wi) => {
                  const cell = week[di];
                  if (!cell) return <div key={wi} className="flex-1" />;
                  return (
                    <div
                      key={wi}
                      className="flex-1 h-8 rounded-md cursor-default transition-transform hover:scale-105 border"
                      style={{
                        backgroundColor: intensityToColor(cell.intensity),
                        borderColor:
                          cell.intensity === 0
                            ? "var(--color-outline-variant)"
                            : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          date: cell.date,
                          pages: cell.pages,
                          x: r.left + r.width / 2,
                          y: r.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Leyenda ── */}
      <div
        className="flex items-center justify-end gap-2 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--color-on-surface-variant)" }}
      >
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="h-4 w-6 rounded-sm border"
            style={{
              backgroundColor: intensityToColor(level),
              borderColor:
                level === 0 ? "var(--color-outline-variant)" : "transparent",
            }}
          />
        ))}
        <span>Más</span>
      </div>
    </section>
  );
}
