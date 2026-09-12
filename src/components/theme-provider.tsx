import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_THEME, themeCssVars, type ThemeSettings } from "@/lib/theme";

const ThemeContext = createContext<ThemeSettings>(DEFAULT_THEME);

export function ThemeProvider({ theme, children }: { theme: ThemeSettings; children: ReactNode }) {
  return <ThemeContext.Provider value={theme || DEFAULT_THEME}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext) || DEFAULT_THEME;
}

export function ThemeVars({ theme }: { theme: ThemeSettings }) {
  const vars = themeCssVars(theme);
  const css = `:root{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}body{font-family:${vars["--font-sans"]}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
