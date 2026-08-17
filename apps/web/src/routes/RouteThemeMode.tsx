import { useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
export function RouteThemeMode() {
  const { pathname } = useLocation();
  const { resolvedTheme } = useTheme();
  const useLightMode = ["/login", "/signup", "/onboarding"].includes(pathname);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const applyRouteTheme = () => {
      root.classList.toggle("dark", !useLightMode && resolvedTheme === "dark");
      root.style.colorScheme = useLightMode
        ? "light"
        : (resolvedTheme ?? "light");
    };

    applyRouteTheme();

    if (!useLightMode) return;

    // next-themes also applies its saved mode on mount; keep these routes light
    // when that initial update runs, without changing the saved preference.
    const observer = new MutationObserver(applyRouteTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [resolvedTheme, useLightMode]);

  return <Outlet />;
}
