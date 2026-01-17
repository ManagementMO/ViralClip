import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
} from "remotion";

interface ProductCardProps {
  title: string;
  price: string;
  image: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  title,
  price,
  image,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide up animation
  const slideProgress = spring({
    frame,
    fps,
    config: {
      damping: 15,
      mass: 0.8,
    },
  });

  const translateY = interpolate(slideProgress, [0, 1], [200, 0]);
  const opacity = interpolate(slideProgress, [0, 0.5, 1], [0, 0.8, 1]);

  // Glitch effect on price (subtle)
  const glitchActive = frame % 30 < 2;
  const glitchOffset = glitchActive ? Math.random() * 4 - 2 : 0;

  // Pulsing glow on price
  const glowIntensity = 0.5 + Math.sin(frame * 0.15) * 0.3;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "40px",
        paddingBottom: "80px",
      }}
    >
      <div
        style={{
          transform: `translateY(${translateY}px)`,
          opacity,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "24px",
          width: "90%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Product Image */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Img
            src={image}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Product Title */}
        <div
          style={{
            color: "#ffffff",
            fontSize: "24px",
            fontWeight: 600,
            fontFamily: "Inter, sans-serif",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>

        {/* Price with glitch effect */}
        <div
          style={{
            transform: `translateX(${glitchOffset}px)`,
            color: "#ccff00",
            fontSize: "36px",
            fontWeight: 800,
            fontFamily: "Oswald, sans-serif",
            textShadow: `
              0 0 ${20 * glowIntensity}px rgba(204, 255, 0, ${glowIntensity}),
              0 0 ${40 * glowIntensity}px rgba(204, 255, 0, ${glowIntensity * 0.5})
            `,
          }}
        >
          {price}
        </div>

        {/* CTA Button */}
        <div
          style={{
            background: "linear-gradient(135deg, #ccff00 0%, #99cc00 100%)",
            color: "#000000",
            padding: "12px 32px",
            borderRadius: "50px",
            fontSize: "16px",
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            boxShadow: `0 4px 20px rgba(204, 255, 0, ${0.3 * glowIntensity})`,
          }}
        >
          Shop Now
        </div>
      </div>
    </AbsoluteFill>
  );
};
