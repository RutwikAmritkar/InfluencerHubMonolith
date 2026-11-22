import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  // Resolve if effectively dark (including system preference)
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#E5E4DF] dark:border-white/10 hover:border-slate-400 dark:hover:border-white/25 bg-white dark:bg-[#121216] text-xs font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#F2F1EC] dark:hover:bg-white/[0.06] transition-colors cursor-pointer shadow-xs",
        className
      )}
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 text-[#E87985] transition-transform duration-200 rotate-0 scale-100" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-[#6A0D18] transition-transform duration-200 rotate-0 scale-100" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">{isDark ? "Light Mode" : "Dark Mode"}</span>
      )}
    </button>
  );
}

export default ThemeToggle;
