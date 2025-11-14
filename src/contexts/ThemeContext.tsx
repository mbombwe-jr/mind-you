import React, { createContext, useContext, useState, ReactNode } from "react";

type Theme = "theme-light" | "theme-yellow" | "theme-dark" | "theme-green" | "theme-blue" | "theme-red";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("theme-light");

  const toggleTheme = () => {
    setTheme((prev) =>
      prev === "theme-light"
        ? "theme-dark"
        : prev === "theme-dark"
        ? "theme-blue"
        : prev === "theme-blue"
        ? "theme-green"
        : prev === "theme-green"
        ? "theme-red"
        : "theme-light"
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
