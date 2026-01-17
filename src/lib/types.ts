import { z } from "zod";

// Caption style types
export const CaptionStyleSchema = z.enum(["impact", "minimal", "glitch", "typewriter"]);
export type CaptionStyle = z.infer<typeof CaptionStyleSchema>;

// Caption entry
export const CaptionSchema = z.object({
  startFrame: z.number(),
  endFrame: z.number(),
  text: z.string(),
  style: CaptionStyleSchema,
});
export type Caption = z.infer<typeof CaptionSchema>;

// Media clip reference (video or image)
export const ClipSchema = z.object({
  startFrame: z.number(),
  duration: z.number(),
  type: z.enum(["video", "image"]).default("video"),
  url: z.string().url(),
  sourceStartTime: z.number().default(0), // Only for video clips
});
export type Clip = z.infer<typeof ClipSchema>;

// Product information
export const ProductSchema = z.object({
  title: z.string(),
  price: z.string(),
  image: z.string().url(),
  description: z.string().optional(),
  url: z.string().url().optional(),
});
export type Product = z.infer<typeof ProductSchema>;

// Main Video Manifest
export const VideoManifestSchema = z.object({
  id: z.string().optional(),
  script: z.string(),
  audioUrl: z.string().url().optional(),
  captions: z.array(CaptionSchema),
  clips: z.array(ClipSchema),
  product: ProductSchema,
  fps: z.number().default(30),
  durationInFrames: z.number(),
  width: z.number().default(1080),
  height: z.number().default(1920),
  // Use string or Date to handle JSON serialization in Remotion player
  createdAt: z.union([z.date(), z.string()]).optional(),
});
export type VideoManifest = z.infer<typeof VideoManifestSchema>;

// Chat message types
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.date(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Project state
export const ProjectStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  manifest: VideoManifestSchema.optional(),
  chatHistory: z.array(ChatMessageSchema),
  status: z.enum(["idle", "generating", "ready", "error"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProjectState = z.infer<typeof ProjectStateSchema>;

// Generation request
export const GenerateVideoRequestSchema = z.object({
  productUrl: z.string().url(),
  style: z.enum(["hype", "minimal", "luxury", "playful"]).default("hype"),
  duration: z.enum(["short", "medium", "long"]).default("short"),
});
export type GenerateVideoRequest = z.infer<typeof GenerateVideoRequestSchema>;

// API Response types
export interface GenerateVideoResponse {
  success: boolean;
  manifest?: VideoManifest;
  error?: string;
}

export interface ScrapedProduct {
  title: string;
  price: string;
  image: string;
  description: string;
  images: string[];
}
