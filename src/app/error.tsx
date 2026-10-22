"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        If this keeps happening after a site update, your old sign-in may be
        stuck. Start fresh — you will not need to clear cookies yourself.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button asChild>
          <a href="/auth/recover">Sign in again</a>
        </Button>
      </div>
    </div>
  );
}
