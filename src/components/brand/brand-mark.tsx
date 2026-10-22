import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

/** Tennis ball with seam and a short prep trajectory. Used in chrome and auth. */
export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="64" height="64" rx="16" fill="#2D6A4F" />
      <circle cx="32" cy="34" r="18" fill="#1B4332" />
      <path
        d="M22 20c6 6 6 22 0 28"
        fill="none"
        stroke="#F4F7F2"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M42 20c-6 6-6 22 0 28"
        fill="none"
        stroke="#F4F7F2"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M44 12c7 2 12 8 14 14"
        fill="none"
        stroke="#D4E157"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

type BrandLockupProps = {
  label: string;
  collapsed?: boolean;
  className?: string;
  markClassName?: string;
};

export function BrandLockup({
  label,
  collapsed = false,
  className,
  markClassName
}: BrandLockupProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <BrandMark
        className={cn("h-8 w-8", markClassName)}
        {...(collapsed ? { title: label } : {})}
      />
      {collapsed ? null : (
        <span className="truncate font-semibold tracking-tight text-foreground">{label}</span>
      )}
    </span>
  );
}
