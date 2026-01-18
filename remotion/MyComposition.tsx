import React, { useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  useCurrentFrame,
  Video,
  Img,
  Audio,
  spring,
  interpolate,
  random,
} from "remotion";
import type { VideoManifest, Clip, Theme, TransitionType } from "../src/lib/types";
import { THEME_PRESETS } from "../src/lib/types";
import { DynamicText } from "./components/DynamicText";
import { ProductCard } from "./components/ProductCard";

// Get default theme
const DEFAULT_THEME = THEME_PRESETS.cyber;

// Transition effects
const TransitionEffect: React.FC<{
  type: TransitionType;
  progress: number;
  children: React.ReactNode;
}> = ({ type, progress, children }) => {
  switch (type) {
    case "glitch":
      // Glitch effect with RGB split and displacement
      const glitchOffset = progress < 0.1 ? random(`glitch-${progress}`) * 10 : 0;
      const rgbSplit = progress < 0.1 ? 3 : 0;
      return (
        <AbsoluteFill
          style={{
            transform: `translateX(${glitchOffset}px)`,
            filter: progress < 0.1 ? `drop-shadow(${rgbSplit}px 0 0 #ff0066) drop-shadow(-${rgbSplit}px 0 0 #00ffff)` : 'none',
          }}
        >
          {children}
        </AbsoluteFill>
      );

    case "fade":
      return (
        <AbsoluteFill style={{ opacity: Math.min(1, progress * 3) }}>
          {children}
        </AbsoluteFill>
      );

    case "slide":
      const slideX = interpolate(progress, [0, 0.3], [100, 0], {
        extrapolateRight: "clamp",
      });
      return (
        <AbsoluteFill style={{ transform: `translateX(${slideX}%)` }}>
          {children}
        </AbsoluteFill>
      );

    case "zoom":
      const zoomScale = interpolate(progress, [0, 0.2], [1.5, 1], {
        extrapolateRight: "clamp",
      });
      const zoomOpacity = interpolate(progress, [0, 0.15], [0, 1], {
        extrapolateRight: "clamp",
      });
      return (
        <AbsoluteFill
          style={{
            transform: `scale(${zoomScale})`,
            opacity: zoomOpacity,
          }}
        >
          {children}
        </AbsoluteFill>
      );

    default:
      return <AbsoluteFill>{children}</AbsoluteFill>;
  }
};

// Image clip component with Ken Burns effect
const ImageClip: React.FC<{
  clip: Clip;
  theme: Theme;
}> = ({ clip, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [hasError, setHasError] = useState(false);

  // Log for debugging
  if (frame === 0 || frame === 15) {
    console.log("[ImageClip] Frame:", frame, "URL:", clip.url?.substring(0, 60), "Error:", hasError);
  }

  // Calculate progress through the clip
  const progress = interpolate(frame, [0, clip.duration], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Ken Burns effect - configurable via theme
  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  if (theme.kenBurnsEnabled) {
    const kenBurnsScale = theme.kenBurnsScale || 1.1;
    scale = interpolate(progress, [0, 1], [1, kenBurnsScale]);
    translateX = interpolate(progress, [0, 1], [0, -2]);
    translateY = interpolate(progress, [0, 1], [0, -1]);
  }

  // Fade in
  const opacity = spring({
    frame,
    fps,
    config: { damping: 20 },
    durationInFrames: 15,
  });

  // Apply transition
  const transition = clip.transition || theme.transition;

  // Handle missing URL or error - show themed background fallback
  if (!clip.url || hasError) {
    return <ThemedBackground theme={theme} />;
  }

  return (
    <TransitionEffect type={transition} progress={progress}>
      <AbsoluteFill
        style={{
          opacity,
          transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
        }}
      >
        <Img
          src={clip.url}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          pauseWhenLoading
          delayRenderTimeoutInMilliseconds={30000}
          maxRetries={3}
          onError={(e) => {
            console.error("[ImageClip] Failed to load image:", clip.url, e);
            setHasError(true);
          }}
        />
      </AbsoluteFill>
    </TransitionEffect>
  );
};

// Video clip component
const VideoClip: React.FC<{
  clip: Clip;
  theme: Theme;
}> = ({ clip, theme }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const [hasError, setHasError] = useState(false);

  // Debug logging
  if (frame === 0 || frame === 30) {
    console.log("[VideoClip] Frame:", frame, "Video URL:", clip.url, "Type:", clip.type, "Error:", hasError);
  }

  const progress = interpolate(frame, [0, clip.duration], [0, 1], {
    extrapolateRight: "clamp",
  });

  const transition = clip.transition || theme.transition;

  // Handle error - show themed background fallback
  if (hasError || !clip.url) {
    console.error("[VideoClip] Video failed to load or no URL:", clip.url);
    return <ThemedBackground theme={theme} />;
  }

  return (
    <TransitionEffect type={transition} progress={progress}>
      <Video
        src={clip.url}
        startFrom={Math.round((clip.sourceStartTime || 0) * fps)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        pauseWhenLoading
        onError={(e) => {
          console.error("[VideoClip] Video error:", clip.url, e);
          setHasError(true);
        }}
      />
    </TransitionEffect>
  );
};

// Theme-aware gradient background
const ThemedBackground: React.FC<{ theme: Theme }> = ({ theme }) => {
  const { primaryColor, secondaryColor, backgroundColor } = theme;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${backgroundColor} 0%, ${secondaryColor}22 50%, ${primaryColor}11 100%)`,
      }}
    />
  );
};

// Animated background effect for cyber theme
const CyberBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const scanlineY = (frame * 2) % 100;

  return (
    <AbsoluteFill>
      {/* Base gradient */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, #0a0a0f 0%, #1a0a1a 50%, #0a1a1a 100%)`,
        }}
      />
      {/* Scanline effect */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            rgba(0, 255, 136, 0.03) 1px,
            transparent 2px,
            transparent 4px
          )`,
          transform: `translateY(${scanlineY}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Grain/noise overlay
const FilmGrain: React.FC<{ intensity?: number }> = ({ intensity = 0.05 }) => {
  const frame = useCurrentFrame();
  // Use deterministic random for noise
  const seed = `grain-${frame}`;

  return (
    <AbsoluteFill
      style={{
        opacity: intensity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

export const MyComposition: React.FC<VideoManifest> = ({
  captions = [],
  clips = [],
  product,
  audioUrl,
  musicUrl,
  musicVolume = 0.3,
  voiceVolume = 1.0,
  theme,
}) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Debug: Log received props on first frame and periodically
  if (frame === 0 || frame === 30 || frame === 60) {
    console.log("[COMPOSITION] Frame:", frame, "Received clips:", clips?.length || 0);
    if (frame === 0) {
      console.log("[COMPOSITION] Clips data:", JSON.stringify(clips, null, 2));
      console.log("[COMPOSITION] Product:", product?.title);
      console.log("[COMPOSITION] Theme:", theme?.id || "none");
      console.log("[COMPOSITION] Audio URL:", audioUrl ? "present" : "none");
    }
  }

  // Use theme or default
  const activeTheme = theme || DEFAULT_THEME;

  // Ensure we have valid arrays to prevent rendering errors
  const safeClips = Array.isArray(clips) ? clips : [];
  const safeCaptions = Array.isArray(captions) ? captions : [];

  // Default product values if not provided
  const safeProduct = {
    title: product?.title || "Product",
    price: product?.price || "$0.00",
    image: product?.image || "https://via.placeholder.com/400",
  };

  // Get theme colors
  const { fontFamily, primaryColor, accentColor, backgroundColor } = activeTheme;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: `${fontFamily}, sans-serif`,
      }}
    >
      {/* Theme-specific background */}
      {activeTheme.id === "cyber" ? (
        <CyberBackground />
      ) : (
        <ThemedBackground theme={activeTheme} />
      )}

      {/* Background media clips layer */}
      <AbsoluteFill>
        {safeClips.length > 0 ? (
          safeClips.map((clip, index) => {
            // Skip clips without valid URLs
            if (!clip.url || clip.url.includes("placeholder")) {
              return (
                <Sequence key={index} from={clip.startFrame} durationInFrames={clip.duration}>
                  <ThemedBackground theme={activeTheme} />
                </Sequence>
              );
            }
            return (
              <Sequence
                key={index}
                from={clip.startFrame}
                durationInFrames={clip.duration}
              >
                <AbsoluteFill style={{ opacity: 0.8 }}>
                  {clip.type === "image" ? (
                    <ImageClip clip={clip} theme={activeTheme} />
                  ) : clip.url ? (
                    <VideoClip clip={clip} theme={activeTheme} />
                  ) : null}
                </AbsoluteFill>
              </Sequence>
            );
          })
        ) : safeProduct.image && !safeProduct.image.includes("placeholder") ? (
          // Fallback: use product image if no clips
          <AbsoluteFill style={{ opacity: 0.8 }}>
            <ImageClip
              clip={{
                startFrame: 0,
                duration: durationInFrames,
                type: "image",
                url: safeProduct.image,
                sourceStartTime: 0,
              }}
              theme={activeTheme}
            />
          </AbsoluteFill>
        ) : (
          // No valid images - show themed background with product info
          <ThemedBackground theme={activeTheme} />
        )}
      </AbsoluteFill>

      {/* Theme-appropriate overlay */}
      <AbsoluteFill
        style={{
          background:
            activeTheme.id === "luxe"
              ? `linear-gradient(
                  to bottom,
                  rgba(0, 0, 0, 0.3) 0%,
                  rgba(0, 0, 0, 0.05) 30%,
                  rgba(0, 0, 0, 0.05) 60%,
                  rgba(0, 0, 0, 0.5) 100%
                )`
              : activeTheme.id === "minimal"
              ? `linear-gradient(
                  to bottom,
                  rgba(255, 255, 255, 0.1) 0%,
                  rgba(255, 255, 255, 0) 30%,
                  rgba(255, 255, 255, 0) 60%,
                  rgba(255, 255, 255, 0.2) 100%
                )`
              : `linear-gradient(
                  to bottom,
                  rgba(0, 0, 0, 0.4) 0%,
                  rgba(0, 0, 0, 0.1) 30%,
                  rgba(0, 0, 0, 0.1) 60%,
                  rgba(0, 0, 0, 0.6) 100%
                )`,
        }}
      />

      {/* Dynamic text/captions layer */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {safeCaptions.map((caption, index) => (
          <Sequence
            key={index}
            from={caption.startFrame}
            durationInFrames={caption.endFrame - caption.startFrame}
          >
            <DynamicText
              text={caption.text}
              style={caption.style}
              durationInFrames={caption.endFrame - caption.startFrame}
              theme={activeTheme}
              // Per-caption style overrides
              color={caption.color}
              fontSize={caption.fontSize}
              fontWeight={caption.fontWeight}
              fontFamily={caption.fontFamily}
            />
          </Sequence>
        ))}
      </AbsoluteFill>

      {/* Product card - appears at the end */}
      <Sequence from={Math.max(0, durationInFrames - 90)} durationInFrames={90}>
        <ProductCard
          title={safeProduct.title}
          price={safeProduct.price}
          image={safeProduct.image}
          theme={activeTheme}
        />
      </Sequence>

      {/* Film grain for luxury theme */}
      {activeTheme.id === "luxe" && <FilmGrain intensity={0.04} />}

      {/* Vignette effect */}
      <AbsoluteFill
        style={{
          background:
            activeTheme.id === "minimal"
              ? "none"
              : `radial-gradient(
                  ellipse at center,
                  transparent 40%,
                  ${activeTheme.id === "luxe" ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.4)"} 100%
                )`,
          pointerEvents: "none",
        }}
      />

      {/* Audio voiceover */}
      {audioUrl && <Audio src={audioUrl} volume={voiceVolume} />}

      {/* Background music */}
      {musicUrl && <Audio src={musicUrl} volume={musicVolume} />}
    </AbsoluteFill>
  );
};
