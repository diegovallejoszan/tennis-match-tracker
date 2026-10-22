/** Satori-safe markup for generated PNG icons (favicon, touch, Open Graph). */

type BrandIconMarkupProps = {
  size: number;
  showArc?: boolean;
};

export function BrandIconMarkup({ size, showArc = true }: BrandIconMarkupProps) {
  const ball = Math.round(size * 0.56);
  const seam = Math.max(2, Math.round(size * 0.045));
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2D6A4F"
      }}
    >
      <div
        style={{
          width: ball,
          height: ball,
          borderRadius: ball,
          background: "#1B4332",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}
      >
        <div
          style={{
            width: Math.round(ball * 0.42),
            height: Math.round(ball * 0.78),
            borderLeft: `${seam}px solid #F4F7F2`,
            borderRight: `${seam}px solid #F4F7F2`,
            borderRadius: ball,
            display: "flex"
          }}
        />
        {showArc ? (
          <div
            style={{
              position: "absolute",
              top: Math.round(ball * -0.08),
              right: Math.round(ball * -0.02),
              width: Math.round(ball * 0.38),
              height: Math.round(ball * 0.22),
              borderTop: `${seam}px solid #D4E157`,
              borderRight: `${seam}px solid #D4E157`,
              borderTopRightRadius: ball,
              display: "flex"
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
