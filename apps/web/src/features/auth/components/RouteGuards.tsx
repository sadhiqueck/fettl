import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserProfile } from "@/shared/hooks/useUser";
import { Loader2 } from "lucide-react";
import { FullAppSkeleton } from "@/shared/components/layout/FullAppSkeleton";
import { isAxiosError } from "axios";
import { Button } from "@/shared/components/ui/button";

export function ProtectedRoute() {
  const { data: user, isLoading, isError, error, refetch, isFetching } =
    useUserProfile();
  const location = useLocation();

  useEffect(() => {
    // Prevent Back/Forward Cache (bfcache) from showing stale protected pages
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  if (isLoading) {
    return <FullAppSkeleton />;
  }

  if (isError && isAxiosError(error) && error.response?.status === 401) {
    return <Navigate to="/login" replace />;
  }

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <section className="w-full max-w-sm rounded-xl border bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Can’t connect to Fettl</h1>
          <p role="alert" className="mt-2 text-sm text-muted-foreground">
            Your session couldn’t be checked. Check your connection and try
            again.
          </p>
          <Button
            className="mt-6 w-full"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? "Trying again…" : "Try again"}
          </Button>
        </section>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Redirect non-onboarded users to the onboarding page
  if (!user.isOnboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect already-onboarded users away from the onboarding page
  if (user.isOnboarded && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  const invite = sessionStorage.getItem("pendingInvite");
  if (user.isOnboarded && invite && /^[A-Z1-9]{6}$/i.test(invite)) {
    return <Navigate to={`/groups/join/${invite}`} replace />;
  }
  return <Outlet />;
}

export function PublicRoute() {
  const { data: user, isLoading, isFetched, isError, error } = useUserProfile();

  if (isLoading && !isFetched) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // If they are logged in and we have user data (and no error), go to dashboard
  if (user && !isError) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet context={error} />;
}
