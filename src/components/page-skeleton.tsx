import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-primary/10", className)} aria-hidden />;
}

type PageSkeletonProps = {
  variant?: "dashboard" | "list" | "form" | "detail" | "prepare" | "auth";
};

export function PageSkeleton({ variant = "list" }: PageSkeletonProps) {
  if (variant === "auth") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4" aria-busy="true">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Bone className="mx-auto h-10 w-10 rounded-xl" />
          <Bone className="mx-auto h-6 w-40" />
          <Bone className="h-4 w-full" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" aria-busy="true" aria-live="polite">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Bone className="h-8 w-48" />
        {variant === "list" || variant === "dashboard" ? <Bone className="h-9 w-28" /> : null}
      </div>

      {variant === "dashboard" ? (
        <>
          <Bone className="mb-6 h-16 w-full" />
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Bone className="h-28" />
            <Bone className="h-28" />
            <Bone className="h-28" />
            <Bone className="h-28" />
          </div>
          <Bone className="h-56 w-full" />
        </>
      ) : null}

      {variant === "list" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Bone className="h-36" />
          <Bone className="h-36" />
          <Bone className="h-36" />
        </div>
      ) : null}

      {variant === "form" || variant === "detail" ? (
        <div className="max-w-2xl space-y-4">
          <Bone className="h-10 w-full" />
          <Bone className="h-10 w-full" />
          <Bone className="h-28 w-full" />
          <Bone className="h-10 w-32" />
        </div>
      ) : null}

      {variant === "prepare" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            <Bone className="h-10 w-full" />
            <Bone className="h-10 w-full" />
            <Bone className="h-10 w-36" />
            <Bone className="h-64 w-full" />
          </div>
          <Bone className="h-72" />
        </div>
      ) : null}
    </div>
  );
}
