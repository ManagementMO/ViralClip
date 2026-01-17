import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  random,
} from "remotion";
import type { Theme } from "../../src/lib/types";
import { THEME_PRESETS } from "../../src/lib/types";

interface ProductCardProps {
  title: string;
  price: string;
  image: string;
  theme?: Theme;
}

// Helper to convert hex color to RGB values
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "255, 255, 255";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  title,
  price,
  image,
  theme = THEME_PRESETS.cyber,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Get theme colors
  const { primaryColor, secondaryColor, accentColor, fontFamily, backgroundColor } = theme;
  const primaryRgb = hexToRgb(primaryColor);

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

  // Glitch effect on price (only for cyber theme)
  const glitchActive = theme.id === "cyber" && frame % 30 < 2;
  const glitchOffset = glitchActive ? random(`price-glitch-${frame}`) * 4 - 2 : 0;

  // Pulsing glow on price (intensity based on theme)
  const glowIntensity = theme.id === "cyber"
    ? 0.5 + Math.sin(frame * 0.15) * 0.3
    : theme.id === "luxe"
    ? 0.3 + Math.sin(frame * 0.08) * 0.1
    : 0.2;

  // Theme-specific card styles
  const cardBackground = theme.id === "minimal"
    ? "rgba(255, 255, 255, 0.95)"
    : theme.id === "luxe"
    ? "rgba(26, 26, 26, 0.9)"
    : "rgba(0, 0, 0, 0.7)";

  const cardBorder = theme.id === "minimal"
    ? "1px solid rgba(0, 0, 0, 0.1)"
    : theme.id === "luxe"
    ? "1px solid rgba(212, 175, 55, 0.3)"
    : "1px solid rgba(255, 255, 255, 0.1)";

  const titleColor = theme.id === "minimal" ? "#1a1a1a" : "#ffffff";

  const ctaBackground = theme.id === "minimal"
    ? "#1a1a1a"
    : theme.id === "luxe"
    ? `linear-gradient(135deg, ${primaryColor} 0%, #c4a030 100%)`
    : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor !== "#1a1a1a" ? secondaryColor : "#99cc00"} 100%)`;

  const ctaTextColor = theme.id === "minimal" ? "#ffffff" : "#000000";

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
          background: cardBackground,
          backdropFilter: "blur(20px)",
          borderRadius: theme.id === "luxe" ? "8px" : "24px",
          border: cardBorder,
          padding: "24px",
          width: "90%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          boxShadow: theme.id === "luxe"
            ? `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 20px rgba(${primaryRgb}, 0.1)`
            : "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Product Image */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: theme.id === "luxe" ? "4px" : "16px",
            overflow: "hidden",
            boxShadow: theme.id === "luxe"
              ? `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 10px rgba(${primaryRgb}, 0.2)`
              : "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: theme.id === "luxe" ? `2px solid ${primaryColor}44` : "none",
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
            color: titleColor,
            fontSize: theme.id === "luxe" ? "22px" : "24px",
            fontWeight: theme.id === "luxe" ? 400 : 600,
            fontFamily: `${fontFamily}, sans-serif`,
            textAlign: "center",
            lineHeight: 1.3,
            letterSpacing: theme.id === "luxe" ? "0.05em" : "normal",
            textTransform: theme.id === "luxe" ? "uppercase" : "none",
          }}
        >
          {title}
        </div>

        {/* Price with theme-appropriate effects */}
        <div
          style={{
            transform: `translateX(${glitchOffset}px)`,
            color: theme.id === "minimal" ? "#1a1a1a" : primaryColor,
            fontSize: theme.id === "luxe" ? "32px" : "36px",
            fontWeight: theme.id === "luxe" ? 300 : 800,
            fontFamily: `${fontFamily}, sans-serif`,
            letterSpacing: theme.id === "luxe" ? "0.1em" : "normal",
            textShadow: theme.id === "minimal"
              ? "none"
              : `
                0 0 ${20 * glowIntensity}px rgba(${primaryRgb}, ${glowIntensity}),
                0 0 ${40 * glowIntensity}px rgba(${primaryRgb}, ${glowIntensity * 0.5})
              `,
          }}
        >
          {price}
        </div>

        {/* CTA Button */}
        <div
          style={{
            background: ctaBackground,
            color: ctaTextColor,
            padding: theme.id === "luxe" ? "14px 40px" : "12px 32px",
            borderRadius: theme.id === "luxe" ? "0" : "50px",
            fontSize: theme.id === "luxe" ? "14px" : "16px",
            fontWeight: theme.id === "luxe" ? 500 : 700,
            fontFamily: `${fontFamily}, sans-serif`,
            textTransform: "uppercase",
            letterSpacing: theme.id === "luxe" ? "0.2em" : "0.1em",
            boxShadow: theme.id === "minimal"
              ? "0 4px 12px rgba(0, 0, 0, 0.15)"
              : `0 4px 20px rgba(${primaryRgb}, ${0.3 * glowIntensity})`,
          }}
        >
          {theme.id === "luxe" ? "Discover" : "Shop Now"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
