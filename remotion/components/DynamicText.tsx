import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  random,
} from "remotion";
import type { CaptionStyle, Theme } from "../../src/lib/types";
import { THEME_PRESETS } from "../../src/lib/types";

interface DynamicTextProps {
  text: string;
  style: CaptionStyle;
  durationInFrames: number;
  theme?: Theme;
  // Per-caption style overrides
  color?: string;
  fontSize?: string;
  fontWeight?: number;
  fontFamily?: string;
}

// Base CSS properties shared across styles
interface BaseStyleProps {
  transform: string;
  color: string;
  fontSize: string;
  fontWeight: number;
  fontFamily: string;
  textTransform: "uppercase" | "none";
  letterSpacing: string;
  textShadow: string;
}

// Typewriter style has additional props
interface TypewriterStyleProps extends BaseStyleProps {
  charsToShow: number;
  cursorOpacity: number;
}

type StyleProps = BaseStyleProps | TypewriterStyleProps;

function isTypewriterStyle(props: StyleProps): props is TypewriterStyleProps {
  return "charsToShow" in props;
}

export const DynamicText: React.FC<DynamicTextProps> = ({
  text,
  style,
  durationInFrames,
  theme = THEME_PRESETS.cyber,
  // Per-caption overrides
  color: colorOverride,
  fontSize: fontSizeOverride,
  fontWeight: fontWeightOverride,
  fontFamily: fontFamilyOverride,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Get theme colors
  const { primaryColor, secondaryColor, accentColor, fontFamily } = theme;

  // Entry animation
  const entryProgress = spring({
    frame,
    fps,
    config: {
      damping: 12,
      mass: 0.5,
    },
  });

  // Exit animation (start fading out in last 10 frames)
  const exitStart = Math.max(0, durationInFrames - 10);
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = entryProgress * exitProgress;

  // Impact style - bold, scale pop, with glow
  function getImpactStyle(): BaseStyleProps {
    const scale = spring({
      frame,
      fps,
      config: {
        damping: 8,
        mass: 0.4,
      },
      from: 1.5,
      to: 1,
    });

    // Deterministic shake effect based on frame
    const shakeX =
      Math.sin(frame * 0.5) *
      interpolate(frame, [0, 10], [5, 0], { extrapolateRight: "clamp" });

    // Theme-specific glow color
    const glowColor = primaryColor;
    const glowRgb = hexToRgb(glowColor);

    return {
      transform: `scale(${scale}) translateX(${shakeX}px)`,
      color: primaryColor,
      fontSize: "clamp(48px, 8vw, 72px)",
      fontWeight: 900,
      fontFamily: `${fontFamily}, sans-serif`,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      textShadow: `
        0 0 20px rgba(${glowRgb}, 0.8),
        0 0 40px rgba(${glowRgb}, 0.4),
        0 0 60px rgba(${glowRgb}, 0.2),
        2px 2px 0 #000,
        -2px -2px 0 #000,
        2px -2px 0 #000,
        -2px 2px 0 #000
      `,
    };
  }

  // Glitch style - RGB split effect with deterministic randomness
  function getGlitchStyle(): BaseStyleProps {
    // Use Remotion's random() for deterministic per-frame randomness
    const glitchSeed = random(`glitch-${frame}`);
    const shouldGlitch = glitchSeed > 0.9;
    const glitchOffset = shouldGlitch ? (random(`offset-${frame}`) * 10 - 5) : 0;
    const rgbOffset = 3 + Math.sin(frame * 0.3) * 2;

    return {
      transform: `translateX(${glitchOffset}px)`,
      color: accentColor,
      fontSize: "clamp(40px, 7vw, 64px)",
      fontWeight: 800,
      fontFamily: `${fontFamily}, sans-serif`,
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      textShadow: `
        ${rgbOffset}px 0 0 ${secondaryColor}bb,
        ${-rgbOffset}px 0 0 ${primaryColor}bb,
        0 0 20px ${secondaryColor}88
      `,
    };
  }

  // Minimal style - clean, subtle fade
  function getMinimalStyle(): BaseStyleProps {
    const slideUp = interpolate(entryProgress, [0, 1], [20, 0]);

    // For minimal theme, use darker text on light backgrounds
    const textColor = theme.id === "minimal" ? "#333333" : "#ffffff";

    return {
      transform: `translateY(${slideUp}px)`,
      color: textColor,
      fontSize: "clamp(32px, 5vw, 48px)",
      fontWeight: 400,
      fontFamily: `${fontFamily}, sans-serif`,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      textShadow: theme.id === "minimal"
        ? "0 2px 10px rgba(0, 0, 0, 0.1)"
        : "0 2px 20px rgba(0, 0, 0, 0.5)",
    };
  }

  // Typewriter style - character reveal
  function getTypewriterStyle(): TypewriterStyleProps {
    const charsToShow = Math.floor(
      interpolate(frame, [0, durationInFrames * 0.6], [0, text.length], {
        extrapolateRight: "clamp",
      })
    );
    // Blink cursor at ~2Hz (human-readable rate)
    const cursorOpacity = Math.sin(frame * 0.2) > 0 ? 1 : 0;

    const textColor = theme.id === "minimal" ? "#333333" : primaryColor;
    const glowRgb = hexToRgb(primaryColor);

    return {
      transform: "none",
      color: textColor,
      fontSize: "clamp(36px, 6vw, 56px)",
      fontWeight: 500,
      fontFamily: `"SF Mono", "Fira Code", monospace`,
      textTransform: "none",
      letterSpacing: "0.05em",
      textShadow: theme.id === "minimal"
        ? "none"
        : `0 0 10px rgba(${glowRgb}, 0.5)`,
      charsToShow,
      cursorOpacity,
    };
  }

  // Get style properties based on caption style
  const getStyleProperties = (): StyleProps => {
    switch (style) {
      case "impact":
        return getImpactStyle();
      case "glitch":
        return getGlitchStyle();
      case "minimal":
        return getMinimalStyle();
      case "typewriter":
        return getTypewriterStyle();
      default:
        return getImpactStyle();
    }
  };

  const styleProps = getStyleProperties();

  // Extract display text and CSS properties
  let displayText = text;
  let cursorOpacity = 0;

  if (isTypewriterStyle(styleProps)) {
    displayText = text.slice(0, styleProps.charsToShow);
    cursorOpacity = styleProps.cursorOpacity;
  }

  // Extract only CSS-compatible properties
  const {
    transform,
    color,
    fontSize,
    fontWeight,
    fontFamily: styleFontFamily,
    textTransform,
    letterSpacing,
    textShadow,
  } = styleProps;

  // Apply per-caption overrides if provided
  const cssProps: React.CSSProperties = {
    transform,
    color: colorOverride || color,
    fontSize: fontSizeOverride || fontSize,
    fontWeight: fontWeightOverride || fontWeight,
    fontFamily: fontFamilyOverride ? `${fontFamilyOverride}, sans-serif` : styleFontFamily,
    textTransform,
    letterSpacing,
    textShadow,
  };

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        opacity,
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "90%",
          lineHeight: 1.2,
          ...cssProps,
        }}
      >
        {displayText}
        {style === "typewriter" && (
          <span
            style={{
              opacity: cursorOpacity,
              marginLeft: "2px",
            }}
          >
            |
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Helper to convert hex color to RGB values
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "255, 255, 255";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
