import { lazy, useLayoutEffect } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "@/features/auth/components/RouteGuards";
import { ChatAppLayout } from "@/shared/components/layout/ChatAppLayout";
import { SocketProvider } from "@/context/SocketProvider";
import { withSuspense } from "@/shared/components/layout/withSuspense";
import { useTheme } from "@/context/ThemeContext";

// AuthPage stays eager as it's the entry point most sessions hit first
import AuthPage from "@/pages/AuthPage";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const GroupDetailsPage = lazy(() => import("@/pages/GroupDetailsPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const JoinGroupPage = lazy(() => import("@/pages/JoinGroupPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function RouteThemeMode() {
  const { pathname } = useLocation();
  const { resolvedTheme } = useTheme();
  const useLightMode = ["/login", "/signup", "/onboarding"].includes(pathname);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const applyRouteTheme = () => {
      root.classList.toggle("dark", !useLightMode && resolvedTheme === "dark");
      root.style.colorScheme = useLightMode ? "light" : resolvedTheme ?? "light";
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


export const router = createBrowserRouter([
  {
    element: <RouteThemeMode />,
    children: [
      {
        path: "/",
        element: <Navigate to="/dashboard" replace />,
      },

      // Public static pages (no auth required)
      { path: "terms", element: withSuspense(TermsPage) },
      { path: "privacy", element: withSuspense(PrivacyPage) },

      // Invite links — handled by JoinGroupPage which redirects to login if needed
      { path: "groups/join/:inviteCode", element: withSuspense(JoinGroupPage) },

      {
        element: <PublicRoute />,
        children: [
          { path: "login", element: <AuthPage /> },
          { path: "signup", element: <AuthPage /> },
        ],
      },

      {
        element: <ProtectedRoute />,
        children: [
          { path: "onboarding", element: withSuspense(OnboardingPage) },
          {
            element: (
              <SocketProvider>
                <ChatAppLayout />
              </SocketProvider>
            ),
            children: [
              { path: "dashboard", element: withSuspense(DashboardPage) },
              { path: "groups/:id", element: withSuspense(GroupDetailsPage) },
              { path: "profile", element: withSuspense(ProfilePage) },
              { path: "analytics", element: withSuspense(AnalyticsPage) },
            ],
          },
        ],
      },

      // Catch-all 404
      { path: "*", element: withSuspense(NotFoundPage) },
    ],
  },
]);
