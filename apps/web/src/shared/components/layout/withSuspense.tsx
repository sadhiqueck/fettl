import React, { Suspense, type JSX } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { PageSkeleton } from "./PageSkeleton";

export function withSuspense(Component: React.LazyExoticComponent<() => JSX.Element>) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
