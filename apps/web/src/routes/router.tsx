import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicRoute, OnboardingRoute } from "@/features/auth/components/RouteGuards";
import { ChatAppLayout } from "@/shared/components/layout/ChatAppLayout";
import { SocketProvider } from "@/context/SocketProvider";
import { withSuspense } from "@/shared/components/layout/withSuspense";

// AuthPage stays eager as it's the entry point most sessions hit first
import AuthPage from "@/pages/AuthPage";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const GroupDetailsPage = lazy(() => import("@/pages/GroupDetailsPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));


export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <PublicRoute />,
    children: [
      { path: "login", element: <AuthPage /> },
      { path: "signup", element: <AuthPage /> },
    ],
  },
  {
    element: <OnboardingRoute />,
    children: [
      { path: "onboarding", element: withSuspense(OnboardingPage) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
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
]);
