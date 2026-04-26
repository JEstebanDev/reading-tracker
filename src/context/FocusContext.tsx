"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FocusContextType {
  focusMode: boolean;
  toggleFocus: () => void;
}

const FocusContext = createContext<FocusContextType>({
  focusMode: false,
  toggleFocus: () => {},
});

export function FocusProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);

  const toggleFocus = () => setFocusMode((prev) => !prev);

  return (
    <FocusContext.Provider value={{ focusMode, toggleFocus }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  return useContext(FocusContext);
}
