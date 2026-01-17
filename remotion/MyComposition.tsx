import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  Video,
} from "remotion";
import type { VideoManifest } from "../src/lib/types";
import { DynamicText } from "./components/DynamicText";
import { ProductCard } from "./components/ProductCard";

export const MyComposition: React.FC<VideoManifest> = ({
  captions = [],
  clips = [],
  product,
}) => {
  const { fps, durationInFrames } = useVideoConfig();

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
      {/* Background video clips layer */}
      <AbsoluteFill>
        {safeClips.map((clip, index) => (
          <Sequence
            key={index}
            from={clip.startFrame}
            durationInFrames={clip.duration}
          >
            <AbsoluteFill
              style={{
                opacity: 0.6,
              }}
            >
              {clip.videoUrl ? (
                <Video
                  src={clip.videoUrl}
                  startFrom={Math.round(clip.sourceStartTime * fps)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <AbsoluteFill
                  style={{
                    background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
                  }}
                />
              )}
            </AbsoluteFill>
          </Sequence>
        ))}
      </AbsoluteFill>

      {/* Gradient overlay for better text readability */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.3) 0%,
            transparent 30%,
            transparent 70%,
            rgba(0, 0, 0, 0.5) 100%
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
    </AbsoluteFill>
  );
};
