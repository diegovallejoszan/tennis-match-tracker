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
        d="M18 50A22.5 22.5 0 1 1 55 24"
        fill="none"
        stroke="#1B4332"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="35" cy="36" r="16" fill="#1B4332" />
      <path
        d="M24.5 25.5c4.5 6.5 4.5 14.5 0 21"
        fill="none"
        stroke="#F4F7F2"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M45.5 25.5c-4.5 6.5-4.5 14.5 0 21"
        fill="none"
        stroke="#F4F7F2"
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
