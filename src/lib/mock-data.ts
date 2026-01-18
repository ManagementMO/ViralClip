import type { VideoManifest, ChatMessage } from "./types";

// Sample royalty-free stock video URLs (Big Buck Bunny clips)
const SAMPLE_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

// Mock product for demo
export const MOCK_PRODUCT = {
  title: "Premium Wireless Earbuds Pro",
  price: "$149.99",
  image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
  description: "Experience crystal-clear audio with our latest wireless earbuds featuring active noise cancellation.",
  url: "https://example-store.myshopify.com/products/wireless-earbuds-pro",
};

// Mock video manifest with "hype" style captions
export const MOCK_MANIFEST: VideoManifest = {
  id: "demo-001",
  version: 1,
  script: `Check out these INSANE wireless earbuds!
Premium sound quality that will BLOW YOUR MIND.
Active noise cancellation for the ultimate listening experience.
Only $149.99 - Link in bio!`,
  audioUrl: undefined, // Will be populated by ElevenLabs
  musicVolume: 0.3,
  voiceVolume: 1.0,
  fps: 30,
  durationInFrames: 300, // 10 seconds at 30fps
  width: 1920,
  height: 1080,
  captions: [
    {
      startFrame: 0,
      endFrame: 60,
      text: "CHECK THIS OUT",
      style: "impact",
      position: "center",
    },
    {
      startFrame: 60,
      endFrame: 120,
      text: "INSANE SOUND",
      style: "glitch",
      position: "center",
    },
    {
      startFrame: 120,
      endFrame: 180,
      text: "PREMIUM QUALITY",
      style: "impact",
      position: "center",
    },
    {
      startFrame: 180,
      endFrame: 240,
      text: "NOISE CANCELLING",
      style: "minimal",
      position: "center",
    },
    {
      startFrame: 240,
      endFrame: 300,
      text: "ONLY $149.99",
      style: "impact",
      position: "center",
    },
  ],
  clips: [
    {
      startFrame: 0,
      duration: 150,
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
      sourceStartTime: 0,
    },
    {
      startFrame: 150,
      duration: 150,
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&q=80",
      sourceStartTime: 0,
    },
  ],
  product: MOCK_PRODUCT,
  createdAt: new Date().toISOString(),
};

// Mock chat history for demo
export const MOCK_CHAT_HISTORY: ChatMessage[] = [
  {
    id: "1",
    role: "system",
    content: "Welcome to ViralClip! I'm your AI Director. Paste a Shopify product URL to get started.",
    timestamp: new Date(),
  },
];

// Style presets for video generation
export const STYLE_PRESETS = {
  hype: {
    name: "Hype",
    description: "High energy, bold text, fast cuts",
    colors: ["#ccff00", "#ff0066", "#00ffff"],
    fontWeight: "bold",
    animationSpeed: "fast",
  },
  minimal: {
    name: "Minimal",
    description: "Clean, elegant, subtle animations",
    colors: ["#ffffff", "#f5f5f5", "#e0e0e0"],
    fontWeight: "normal",
    animationSpeed: "slow",
  },
  luxury: {
    name: "Luxury",
    description: "Premium feel, gold accents, smooth transitions",
    colors: ["#d4af37", "#1a1a1a", "#ffffff"],
    fontWeight: "light",
    animationSpeed: "medium",
  },
  playful: {
    name: "Playful",
    description: "Fun colors, bouncy animations, emoji-friendly",
    colors: ["#ff6b6b", "#4ecdc4", "#ffe66d"],
    fontWeight: "bold",
    animationSpeed: "fast",
  },
} as const;

// Duration presets
export const DURATION_PRESETS = {
  short: {
    name: "Short",
    frames: 150, // 5 seconds
    description: "Quick attention grabber",
  },
  medium: {
    name: "Medium",
    frames: 300, // 10 seconds
    description: "Standard promo length",
  },
  long: {
    name: "Long",
    frames: 450, // 15 seconds
    description: "Detailed showcase",
  },
} as const;
