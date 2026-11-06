import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

/**
 * PrepCourt logo mark: an optic-yellow tennis ball with edge-to-edge white
 * seams and a forest sweep around the upper left (the ball's trajectory).
 * Seam geometry matches src/app/icon.svg (arcs centred on the ball's
 * bounding-box corners, so they meet the ball at its top/left and
 * bottom/right points).
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
      <circle cx="35" cy="36" r="16" fill="#D9EC45" />
      <path d="M35 20A16 16 0 0 1 19 36" fill="none" stroke="#FFFFFF" strokeWidth="2.6" />
      <path d="M35 52A16 16 0 0 1 51 36" fill="none" stroke="#FFFFFF" strokeWidth="2.6" />
      <circle cx="35" cy="36" r="16" fill="none" stroke="#1B4332" strokeWidth="1.8" />
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
