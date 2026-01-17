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
} from "remotion";
import type { VideoManifest, Clip } from "../src/lib/types";
import { DynamicText } from "./components/DynamicText";
import { ProductCard } from "./components/ProductCard";

// Image clip component with Ken Burns effect
const ImageClip: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns effect - slow zoom and pan
  const progress = interpolate(frame, [0, clip.duration], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Alternate between zoom-in and zoom-out
  const scale = 1 + progress * 0.15;
  const translateX = interpolate(progress, [0, 1], [0, -3]);
  const translateY = interpolate(progress, [0, 1], [0, -2]);

  // Fade in
  const opacity = spring({
    frame,
    fps,
    config: { damping: 20 },
    durationInFrames: 15,
  });

  return (
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
      />
    </AbsoluteFill>
  );
};

// Video clip component
const VideoClip: React.FC<{ clip: Clip }> = ({ clip }) => {
  const { fps } = useVideoConfig();

  return (
    <Video
      src={clip.url}
      startFrom={Math.round((clip.sourceStartTime || 0) * fps)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
};

// Gradient background fallback
const GradientBackground: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
    }}
  />
);

export const MyComposition: React.FC<VideoManifest> = ({
  captions = [],
  clips = [],
  product,
  audioUrl,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Ensure we have valid arrays to prevent rendering errors
  const safeClips = Array.isArray(clips) ? clips : [];
  const safeCaptions = Array.isArray(captions) ? captions : [];

  // Default product values if not provided
  const safeProduct = {
    title: product?.title || "Product",
    price: product?.price || "$0.00",
    image: product?.image || "https://via.placeholder.com/400",
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#09090b",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background media clips layer */}
      <AbsoluteFill>
        {safeClips.length > 0 ? (
          safeClips.map((clip, index) => (
            <Sequence
              key={index}
              from={clip.startFrame}
              durationInFrames={clip.duration}
            >
              <AbsoluteFill style={{ opacity: 0.7 }}>
                {clip.type === "image" ? (
                  <ImageClip clip={clip} />
                ) : clip.url ? (
                  <VideoClip clip={clip} />
                ) : (
                  <GradientBackground />
                )}
              </AbsoluteFill>
            </Sequence>
          ))
        ) : (
          // Fallback: use product image if no clips
          <AbsoluteFill style={{ opacity: 0.7 }}>
            <ImageClip
              clip={{
                startFrame: 0,
                duration: durationInFrames,
                type: "image",
                url: safeProduct.image,
                sourceStartTime: 0,
              }}
            />
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      {/* Gradient overlay for better text readability */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(
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
        />
      </Sequence>

      {/* Vignette effect */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 40%,
            rgba(0, 0, 0, 0.4) 100%
          )`,
          pointerEvents: "none",
        }}
      />

      {/* Audio voiceover */}
      {audioUrl && <Audio src={audioUrl} volume={1} />}
    </AbsoluteFill>
  );
};
