"use client";

import { useEffect, useRef, useState } from "react";
import { useFocus } from "@/context/FocusContext";

// ID del video de Lofi en YouTube
const LOFI_VIDEO_ID = "tIMtzkZ93gg"; // lofi selected by user

export default function FocusBar() {
  const { focusMode, toggleFocus } = useFocus();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Animación de entrada / salida
  useEffect(() => {
    if (focusMode) {
      setMounted(true);
      // pequeño delay para que el CSS transition arranque
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(t);
    }
  }, [focusMode]);

  if (!mounted) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 shadow-lg transition-transform duration-400 ease-in-out"
      style={{
        backgroundColor: "var(--color-primary)",
        color: "var(--color-on-primary)",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
      }}
    >
      {/* Izquierda: icono + texto */}
      <div className="flex items-center gap-3">
        <span
          className="material-symbols-outlined text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          self_improvement
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-wide">Modo Enfoque activo</span>
          <span className="text-xs opacity-75">lofi hip hop · beats to study/relax</span>
        </div>
      </div>

      {/* Centro: controles + iframe oculto */}
      <div className="flex items-center gap-3">
        {/* Iframe de YouTube embebido (invisible, solo audio) */}
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${LOFI_VIDEO_ID}?autoplay=1&controls=0&loop=1&playlist=${LOFI_VIDEO_ID}&modestbranding=1&rel=0`}
          allow="autoplay; encrypted-media"
          className="w-0 h-0 opacity-0 pointer-events-none absolute"
          title="Lofi music player"
        />

        {/* Visualizador decorativo de ondas */}
        <div className="flex items-end gap-[3px] h-5">
          {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full opacity-80"
              style={{
                backgroundColor: "var(--color-on-primary)",
                height: `${h * 3}px`,
                animation: `wave ${0.8 + i * 0.1}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

          <span className="text-xs opacity-75 hidden sm:block">lofi · tIMtzkZ93gg</span>
      </div>

      {/* Derecha: botón cerrar */}
      <button
        onClick={toggleFocus}
        className="flex items-center gap-2 rounded-lg border border-white/30 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
        style={{ color: "var(--color-on-primary)" }}
      >
        <span className="material-symbols-outlined text-sm">close</span>
        Salir
      </button>

      {/* Animación CSS para las ondas */}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
