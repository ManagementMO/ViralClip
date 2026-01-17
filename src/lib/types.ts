import { z } from "zod";

// =============================================================================
// THEME SYSTEM
// =============================================================================

export const ThemeIdSchema = z.enum(["cyber", "luxe", "minimal"]);
export type ThemeId = z.infer<typeof ThemeIdSchema>;

export const TransitionTypeSchema = z.enum(["glitch", "fade", "slide", "zoom"]);
export type TransitionType = z.infer<typeof TransitionTypeSchema>;

export const MusicGenreSchema = z.enum(["techno", "classical", "lofi", "cinematic"]);
export type MusicGenre = z.infer<typeof MusicGenreSchema>;

export const ThemeSchema = z.object({
  id: ThemeIdSchema,
  name: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  fontFamily: z.enum(["Oswald", "Playfair Display", "Inter"]),
  transition: TransitionTypeSchema,
  musicGenre: MusicGenreSchema,
  clipDuration: z.number().default(60), // frames per clip
  textAnimation: z.enum(["impact", "minimal", "glitch", "typewriter"]),
  kenBurnsEnabled: z.boolean().default(false),
  kenBurnsScale: z.number().default(1.1), // End scale for Ken Burns
});
export type Theme = z.infer<typeof ThemeSchema>;

// =============================================================================
// CAPTION STYLES
// =============================================================================

export const CaptionStyleSchema = z.enum(["impact", "minimal", "glitch", "typewriter"]);
export type CaptionStyle = z.infer<typeof CaptionStyleSchema>;

export const CaptionSchema = z.object({
  startFrame: z.number(),
  endFrame: z.number(),
  text: z.string(),
  style: CaptionStyleSchema,
  position: z.enum(["top", "center", "bottom"]).default("center"),
});
export type Caption = z.infer<typeof CaptionSchema>;

// =============================================================================
// MEDIA CLIPS
// =============================================================================

export const ClipSchema = z.object({
  id: z.string().optional(),
  startFrame: z.number(),
  duration: z.number(),
  type: z.enum(["video", "image"]).default("video"),
  url: z.string(),
  sourceStartTime: z.number().default(0),
  sourceEndTime: z.number().optional(),
  label: z.string().optional(), // e.g., "Product Close-up", "Unboxing"
  transition: TransitionTypeSchema.optional(),
});
export type Clip = z.infer<typeof ClipSchema>;

// =============================================================================
// PRODUCT
// =============================================================================

export const ProductSchema = z.object({
  title: z.string(),
  price: z.string(),
  image: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  videoUrl: z.string().optional(), // Main product video from Shopify
});
export type Product = z.infer<typeof ProductSchema>;

// =============================================================================
// TWELVELABS VIDEO INDEX
// =============================================================================

export const VideoSegmentSchema = z.object({
  label: z.string(), // e.g., "Product Close-up", "Unboxing", "Human Interaction"
  startTime: z.number(), // seconds
  endTime: z.number(),
  confidence: z.number().optional(),
  thumbnailUrl: z.string().optional(),
});
export type VideoSegment = z.infer<typeof VideoSegmentSchema>;

export const VideoIndexSchema = z.object({
  videoId: z.string(), // TwelveLabs video ID
  videoUrl: z.string(),
  duration: z.number(), // seconds
  segments: z.array(VideoSegmentSchema),
  indexed: z.boolean().default(false),
});
export type VideoIndex = z.infer<typeof VideoIndexSchema>;

// =============================================================================
// MAIN VIDEO MANIFEST (THE "LIVING MANIFEST")
// =============================================================================

export const VideoManifestSchema = z.object({
  id: z.string().optional(),
  version: z.number().default(1),

  // Content
  script: z.string(),
  captions: z.array(CaptionSchema),
  clips: z.array(ClipSchema),
  product: ProductSchema,

  // Audio
  audioUrl: z.string().optional(),
  musicUrl: z.string().optional(),
  musicVolume: z.number().default(0.3),
  voiceVolume: z.number().default(1.0),

  // Theme & Style
  theme: ThemeSchema.optional(),

  // Video Index (TwelveLabs)
  videoIndex: VideoIndexSchema.optional(),

  // Technical
  fps: z.number().default(30),
  durationInFrames: z.number(),
  width: z.number().default(1080),
  height: z.number().default(1920),

  // Metadata
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});
export type VideoManifest = z.infer<typeof VideoManifestSchema>;

// =============================================================================
// DIRECTOR ACTIONS
// =============================================================================

export const DirectorActionSchema = z.object({
  type: z.enum([
    "change_theme",
    "update_clip",
    "search_video",
    "change_music",
    "update_text",
    "adjust_timing",
    "regenerate_script",
  ]),
  payload: z.record(z.unknown()),
  reasoning: z.string().optional(),
});
export type DirectorAction = z.infer<typeof DirectorActionSchema>;

export const DirectorResponseSchema = z.object({
  manifest: VideoManifestSchema,
  actions: z.array(DirectorActionSchema),
  message: z.string(),
});
export type DirectorResponse = z.infer<typeof DirectorResponseSchema>;

// =============================================================================
// CHAT & PROJECT
// =============================================================================

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.union([z.date(), z.string()]),
  manifestVersion: z.number().optional(), // Track which version this message relates to
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ProjectStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  manifest: VideoManifestSchema.optional(),
  chatHistory: z.array(ChatMessageSchema),
  status: z.enum(["idle", "generating", "editing", "ready", "error"]),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});
export type ProjectState = z.infer<typeof ProjectStateSchema>;

// =============================================================================
// API TYPES
// =============================================================================

export const GenerateVideoRequestSchema = z.object({
  productUrl: z.string().url(),
  style: z.enum(["hype", "minimal", "luxury", "playful"]).default("hype"),
  duration: z.enum(["short", "medium", "long"]).default("medium"),
});
export type GenerateVideoRequest = z.infer<typeof GenerateVideoRequestSchema>;

export interface GenerateVideoResponse {
  success: boolean;
  manifest?: VideoManifest;
  error?: string;
}

export interface DirectorEditResponse {
  success: boolean;
  manifest?: VideoManifest;
  message?: string;
  actions?: DirectorAction[];
  error?: string;
}

export interface ScrapedProduct {
  title: string;
  price: string;
  image: string;
  description: string;
  images: string[];
  videoUrl?: string; // Product video if available
}

// =============================================================================
// THEME PRESETS
// =============================================================================

export const THEME_PRESETS: Record<ThemeId, Theme> = {
  cyber: {
    id: "cyber",
    name: "Cyberpunk",
    primaryColor: "#00ff88",
    secondaryColor: "#ff0066",
    accentColor: "#00ffff",
    backgroundColor: "#0a0a0f",
    fontFamily: "Oswald",
    transition: "glitch",
    musicGenre: "techno",
    clipDuration: 45, // Fast cuts
    textAnimation: "glitch",
    kenBurnsEnabled: false,
    kenBurnsScale: 1.0,
  },
  luxe: {
    id: "luxe",
    name: "Luxury",
    primaryColor: "#d4af37",
    secondaryColor: "#1a1a1a",
    accentColor: "#ffffff",
    backgroundColor: "#0d0d0d",
    fontFamily: "Playfair Display",
    transition: "fade",
    musicGenre: "classical",
    clipDuration: 90, // Slow, elegant
    textAnimation: "minimal",
    kenBurnsEnabled: true,
    kenBurnsScale: 1.15,
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    primaryColor: "#ffffff",
    secondaryColor: "#888888",
    accentColor: "#000000",
    backgroundColor: "#f5f5f5",
    fontFamily: "Inter",
    transition: "slide",
    musicGenre: "lofi",
    clipDuration: 60,
    textAnimation: "typewriter",
    kenBurnsEnabled: true,
    kenBurnsScale: 1.08,
  },
};
