"use client";

import { useState } from "react";
import { useFocus } from "@/context/FocusContext";
import { useAuth } from "@/context/AuthContext";
import AddBookModal from "@/components/AddBookModal";

export default function HeaderActions() {
  const { focusMode, toggleFocus } = useFocus();
  const { user, signOut } = useAuth();
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center flex-wrap" style={{ gap: "8px" }}>
        {/* Modo Enfoque */}
        <button
          onClick={toggleFocus}
          className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors"
          style={{
            borderColor: focusMode ? "var(--color-primary)" : "var(--color-outline-variant)",
            color: focusMode ? "var(--color-primary)" : "var(--color-on-surface)",
            backgroundColor: focusMode ? "var(--color-secondary-container)" : "transparent",
          }}
          onMouseEnter={(e) => {
            if (!focusMode)
              e.currentTarget.style.backgroundColor = "var(--color-surface-variant)";
          }}
          onMouseLeave={(e) => {
            if (!focusMode)
              e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span
            className="material-symbols-outlined text-sm"
            style={focusMode ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            timelapse
          </span>
          {focusMode ? "Enfoque ON" : "Modo Enfoque"}
        </button>

        {/* Agregar Libro */}
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
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
          Agregar Libro
        </button>

        {/* Cerrar sesión */}
        {user && (
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors"
            style={{
              borderColor: "var(--color-outline-variant)",
              color: "var(--color-on-surface-variant)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-surface-variant)";
              e.currentTarget.style.color = "var(--color-on-surface)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-on-surface-variant)";
            }}
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Cerrar sesión
          </button>
        )}
      </div>

      {addModalOpen && (
        <AddBookModal onClose={() => setAddModalOpen(false)} />
      )}
    </>
  );
}
