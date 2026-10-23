/** Satori-safe Matches icon: green disc and inward tennis-ball seams. */

type BrandIconMarkupProps = {
  size: number;
};

export function BrandIconMarkup({ size }: BrandIconMarkupProps) {
  const ball = Math.round(size * 0.72);
  const seam = Math.max(3, Math.round(size * 0.045));
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F4F7F2"
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
          gap: Math.round(ball * 0.4)
        }}
      >
        <div
          style={{
            width: Math.round(ball * 0.2),
            height: Math.round(ball * 0.6),
            borderRight: `${seam}px solid #FFFFFF`,
            borderRadius: ball,
            display: "flex"
          }}
        />
        <div
          style={{
            width: Math.round(ball * 0.2),
            height: Math.round(ball * 0.6),
            borderLeft: `${seam}px solid #FFFFFF`,
            borderRadius: ball,
            display: "flex"
          }}
        />
      </div>
    </div>
  );
}
