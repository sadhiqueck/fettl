import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeColor } from "@/context/ThemeContext";
import { cn } from "@/shared/lib/utils";

const MODES = [
  { name: "Light", value: "light", icon: Sun },
  { name: "Dark", value: "dark", icon: Moon },
  { name: "System", value: "system", icon: Monitor },
] as const;

const COLORS: { name: string; value: ThemeColor; dot: string }[] = [
  { name: "Fettl", value: "brand", dot: "bg-[#d6af43]" },
  { name: "Indigo", value: "indigo", dot: "bg-indigo-500" },
  { name: "Emerald", value: "emerald", dot: "bg-emerald-500" },
  { name: "Rose", value: "rose", dot: "bg-rose-500" },
];

export function ThemeToggle() {
  const { themeMode, setThemeMode, themeColor, setThemeColor } = useTheme();

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Mode</legend>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(({ name, value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={themeMode === value}
              onClick={() => setThemeMode(value)}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                themeMode === value
                  ? "border-foreground/30 bg-muted text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Accent color</legend>
        <div className="grid grid-cols-2 gap-2">
          {COLORS.map(({ name, value, dot }) => (
            <button
              key={value}
              type="button"
              aria-pressed={themeColor === value}
              onClick={() => setThemeColor(value)}
              className={cn(
                "flex h-10 items-center gap-2 rounded-lg border px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                themeColor === value
                  ? "border-foreground/30 bg-muted font-medium text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className={cn("size-4 shrink-0 rounded-full", dot)} aria-hidden="true" />
              <span className="min-w-0 truncate">{name}</span>
              {themeColor === value && (
                <Check className="ml-auto size-3.5 shrink-0" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
