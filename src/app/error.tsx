"use client";

import { AppErrorFallback } from "@/components/app-error-fallback";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error(props: ErrorProps) {
  return <AppErrorFallback {...props} />;
}
