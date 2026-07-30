import { Skeleton } from "@/shared/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="flex h-full w-full bg-background overflow-hidden animate-in fade-in duration-500">
      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 gap-6 max-w-5xl mx-auto w-full mt-14 md:mt-0">
        <header className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48 sm:w-64 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full md:hidden shrink-0" />
        </header>
        
        <div className="flex-1 space-y-6 mt-4">
          <Skeleton className="h-40 w-full rounded-3xl" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
