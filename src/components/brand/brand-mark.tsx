import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

/**
 * PrepCourt logo mark from docs/branding/alt-c/logo.jpg:
 * forest ball, seams that bow inward, and a sweep around the upper left.
 */
export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M16.5 49.5A23 23 0 1 1 54 22.5"
        fill="none"
        stroke="#1B4332"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="34" cy="36" r="15" fill="#1B4332" />
      <path
        d="M26.5 24.5c6.5 5.5 6.5 15.5 0 22"
        fill="none"
        stroke="#F4F7F2"
        strokeWidth="3.3"
        strokeLinecap="round"
      />
      <path
        d="M41.5 24.5c-6.5 5.5-6.5 15.5 0 22"
        fill="none"
        stroke="#F4F7F2"
        strokeWidth="3.3"
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
