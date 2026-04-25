// Animated skeleton loading placeholders
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[var(--secondary)] rounded",
        className
      )}
    />
  );
}

/** Skeleton for a stat card */
export function StatCardSkeleton() {
  return (
    <div className="border border-border p-4">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

/** Skeleton for the hero section */
export function HeroSkeleton() {
  return (
    <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden bg-[var(--secondary)]">
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
        <Skeleton className="h-3 w-40 mb-3" />
        <Skeleton className="h-10 w-72 mb-3" />
        <Skeleton className="h-4 w-96" />
      </div>
    </div>
  );
}

/** Skeleton for a utility card in the grid */
export function UtilityCardSkeleton() {
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/** Skeleton for the training tools grid */
export function TrainingGridSkeleton() {
  return (
    <section className="container py-8">
      <Skeleton className="h-3 w-28 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UtilityCardSkeleton />
        <UtilityCardSkeleton />
        <UtilityCardSkeleton />
        <UtilityCardSkeleton />
        <UtilityCardSkeleton />
        <UtilityCardSkeleton />
      </div>
    </section>
  );
}

/** Skeleton for the weight gauge */
export function WeightGaugeSkeleton() {
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="w-8 h-40" />
        <div className="flex-1">
          <Skeleton className="h-10 w-20 mb-2" />
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
