import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import {
  ProtectedRoute,
  PublicRoute,
} from "@/features/auth/components/RouteGuards";
import { ChatAppLayout } from "@/shared/components/layout/ChatAppLayout";
import { withSuspense } from "@/shared/components/layout/withSuspense";
import { RouteThemeMode } from "./RouteThemeMode";

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

export const router = createBrowserRouter([
  {
    element: <RouteThemeMode />,
    children: [
      // Public static pages (no auth required)
      { path: "terms", element: withSuspense(TermsPage) },
      { path: "privacy", element: withSuspense(PrivacyPage) },

      // Invite links — handled by JoinGroupPage which redirects to login if needed
      { path: "groups/join/:inviteCode", element: withSuspense(JoinGroupPage) },

      {
        element: <PublicRoute />,
        children: [
          { index: true, element: <Navigate to="/login" replace /> },
          { path: "login", element: <AuthPage /> },
          { path: "signup", element: <AuthPage /> },
        ],
      },

      {
        element: <ProtectedRoute />,
        children: [
          { path: "onboarding", element: withSuspense(OnboardingPage) },
          {
            element: <ChatAppLayout />,
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
