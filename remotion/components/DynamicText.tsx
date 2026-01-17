import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { CaptionStyle } from "../../src/lib/types";

interface DynamicTextProps {
  text: string;
  style: CaptionStyle;
  durationInFrames: number;
}

export const DynamicText: React.FC<DynamicTextProps> = ({
  text,
  style,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  // Style-specific animations and styling
  const getStyleProperties = () => {
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

  // Impact style - bold, scale pop, with glow
  function getImpactStyle() {
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

    // Shake effect
    const shakeX = Math.sin(frame * 0.5) * interpolate(
      frame,
      [0, 10],
      [5, 0],
      { extrapolateRight: "clamp" }
    );

    return {
      transform: `scale(${scale}) translateX(${shakeX}px)`,
      color: "#ccff00",
      fontSize: "72px",
      fontWeight: 900,
      fontFamily: "Oswald, sans-serif",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      textShadow: `
        0 0 20px rgba(204, 255, 0, 0.8),
        0 0 40px rgba(204, 255, 0, 0.4),
        0 0 60px rgba(204, 255, 0, 0.2),
        2px 2px 0 #000,
        -2px -2px 0 #000,
        2px -2px 0 #000,
        -2px 2px 0 #000
      `,
    };
  }

  // Glitch style - RGB split effect
  function getGlitchStyle() {
    const glitchOffset = Math.random() > 0.9 ? Math.random() * 10 - 5 : 0;
    const rgbOffset = 3 + Math.sin(frame * 0.3) * 2;

    return {
      transform: `translateX(${glitchOffset}px)`,
      color: "#fff",
      fontSize: "64px",
      fontWeight: 800,
      fontFamily: "Oswald, sans-serif",
      textTransform: "uppercase" as const,
      textShadow: `
        ${rgbOffset}px 0 0 rgba(255, 0, 0, 0.7),
        ${-rgbOffset}px 0 0 rgba(0, 255, 255, 0.7),
        0 0 20px rgba(189, 0, 255, 0.5)
      `,
    };
  }

  // Minimal style - clean, subtle fade
  function getMinimalStyle() {
    const slideUp = interpolate(entryProgress, [0, 1], [20, 0]);

    return {
      transform: `translateY(${slideUp}px)`,
      color: "#ffffff",
      fontSize: "48px",
      fontWeight: 400,
      fontFamily: "Inter, sans-serif",
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      textShadow: "0 2px 20px rgba(0, 0, 0, 0.5)",
    };
  }

  // Typewriter style - character reveal
  function getTypewriterStyle() {
    const charsToShow = Math.floor(
      interpolate(frame, [0, durationInFrames * 0.6], [0, text.length], {
        extrapolateRight: "clamp",
      })
    );
    const cursorOpacity = Math.sin(frame * 0.3) > 0 ? 1 : 0;

    return {
      color: "#ccff00",
      fontSize: "56px",
      fontWeight: 500,
      fontFamily: "monospace",
      letterSpacing: "0.05em",
      textShadow: "0 0 10px rgba(204, 255, 0, 0.5)",
      // The text content will be handled differently for typewriter
      __charsToShow: charsToShow,
      __cursorOpacity: cursorOpacity,
    };
  }

  const styleProps = getStyleProperties();
  const isTypewriter = style === "typewriter";

  // Extract special typewriter props if present
  const { __charsToShow, __cursorOpacity, ...cssProps } = styleProps as Record<string, unknown>;

  const displayText = isTypewriter
    ? text.slice(0, __charsToShow as number)
    : text;

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
          ...(cssProps as React.CSSProperties),
        }}
      >
        {displayText}
        {isTypewriter && (
          <span
            style={{
              opacity: __cursorOpacity as number,
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
