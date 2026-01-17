"use server";

import { GoogleGenAI } from "@google/genai";
import {
  type VideoManifest,
  type GenerateVideoResponse,
  type ScrapedProduct,
  type Caption,
  type DirectorResponse,
  type ThemeId,
  THEME_PRESETS,
} from "@/lib/types";
import { MOCK_MANIFEST } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";
import { scrapeProduct } from "@/lib/scraper";
import { generateVideoVoiceover } from "@/lib/tts";
import { processDirectorCommand, suggestTheme } from "@/lib/director";

// Initialize Google GenAI client
const getGenAI = () => {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Validate parsed captions from AI response
function validateCaptions(captions: unknown): captions is Caption[] {
  if (!Array.isArray(captions)) return false;
  return captions.every(
    (c) =>
      typeof c === "object" &&
      c !== null &&
      typeof c.startFrame === "number" &&
      typeof c.endFrame === "number" &&
      typeof c.text === "string" &&
      typeof c.style === "string"
  );
}

// Generate script and captions using Gemini
async function generateScriptWithGemini(
  product: ScrapedProduct,
  style: string = "hype"
): Promise<{ script: string; captions: VideoManifest["captions"] }> {
  const ai = getGenAI();

  if (!ai) {
    // No API key - return mock data for demo mode
    return {
      script: MOCK_MANIFEST.script,
      captions: MOCK_MANIFEST.captions,
    };
  }

  const prompt = `You are a viral video script writer for TikTok/Instagram Reels.
Create a ${style} style script for this product:

Product: ${product.title}
Price: ${product.price}
Description: ${product.description}

Requirements:
1. Create a 10-second script (5 short punchy lines)
2. Each line should be 2-4 words maximum
3. Use attention-grabbing language
4. Include the price in the last line
5. Style: ${style === "hype" ? "HIGH ENERGY, CAPS, exclamations" : "Clean, minimal, elegant"}

Return ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "script": "Full script as one string with line breaks",
  "captions": [
    {"startFrame": 0, "endFrame": 60, "text": "LINE 1", "style": "impact"},
    {"startFrame": 60, "endFrame": 120, "text": "LINE 2", "style": "glitch"},
    {"startFrame": 120, "endFrame": 180, "text": "LINE 3", "style": "impact"},
    {"startFrame": 180, "endFrame": 240, "text": "LINE 4", "style": "minimal"},
    {"startFrame": 240, "endFrame": 300, "text": "PRICE LINE", "style": "impact"}
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text?.trim() || "";

    // Extract JSON using non-greedy match to find first complete object
    const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as {
          script?: string;
          captions?: unknown;
        };

        // Validate the parsed data
        if (
          typeof parsed.script === "string" &&
          validateCaptions(parsed.captions)
        ) {
          return {
            script: parsed.script,
            captions: parsed.captions,
          };
        }
      } catch {
        // JSON parsing failed, fall through to mock data
      }
    }

    // Fallback to mock data if parsing fails
    return {
      script: MOCK_MANIFEST.script,
      captions: MOCK_MANIFEST.captions,
    };
  } catch {
    // API error - fallback to mock data
    return {
      script: MOCK_MANIFEST.script,
      captions: MOCK_MANIFEST.captions,
    };
  }
}

// Generate image clips from product images
function generateClipsFromImages(
  images: string[],
  durationInFrames: number
): VideoManifest["clips"] {
  if (images.length === 0) {
    return [];
  }

  // Distribute images across the video duration
  const clipDuration = Math.floor(durationInFrames / Math.min(images.length, 5));
  const clipsToUse = images.slice(0, 5); // Max 5 clips

  return clipsToUse.map((url, index) => ({
    startFrame: index * clipDuration,
    duration: clipDuration,
    type: "image" as const,
    url,
    sourceStartTime: 0,
  }));
}

// Main video generation action
export async function generateVideo(
  productUrl: string,
  style: string = "hype"
): Promise<GenerateVideoResponse> {
  try {
    // Step 1: Scrape product details
    const product = await scrapeProduct(productUrl);

    // Step 2: Generate script and captions with Gemini
    const { script, captions } = await generateScriptWithGemini(product, style);

    // Step 3: Generate clips from product images
    const durationInFrames = 300; // 10 seconds
    const clips = generateClipsFromImages(product.images, durationInFrames);

    // Step 4: Generate voiceover audio (optional - requires API key)
    const ttsResult = await generateVideoVoiceover(script, style as "hype" | "minimal" | "luxury" | "playful");

    // Step 5: Determine theme based on style and product
    const themeId: ThemeId = style === "luxury" ? "luxe" : style === "hype" ? "cyber" : suggestTheme(product.title);
    const theme = THEME_PRESETS[themeId];

    // Apply theme-appropriate transitions to clips
    const themedClips = (clips.length > 0 ? clips : [
      {
        startFrame: 0,
        duration: durationInFrames,
        type: "image" as const,
        url: product.image,
        sourceStartTime: 0,
      },
    ]).map(clip => ({
      ...clip,
      transition: theme.transition,
    }));

    // Apply theme-appropriate styles to captions
    const themedCaptions = captions.map(caption => ({
      ...caption,
      style: theme.textAnimation,
    }));

    // Step 6: Build video manifest
    const manifest: VideoManifest = {
      id: generateId(),
      version: 1,
      script,
      audioUrl: ttsResult?.audioUrl,
      fps: 30,
      durationInFrames,
      width: 1080,
      height: 1920,
      captions: themedCaptions,
      clips: themedClips,
      product: {
        title: product.title,
        price: product.price,
        image: product.image,
        description: product.description,
        url: productUrl,
        videoUrl: product.videoUrl,
      },
      theme,
      musicVolume: 0.3,
      voiceVolume: 1.0,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      manifest,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate video",
    };
  }
}

// Chat action for AI Director
export async function sendChatMessage(
  message: string,
  context?: { productUrl?: string; currentManifest?: VideoManifest }
): Promise<{ response: string; action?: string; manifest?: VideoManifest }> {
  // Check for URL in message - this triggers video generation
  const urlMatch = message.match(/https?:\/\/[^\s]+/);

  if (urlMatch) {
    return {
      response:
        "I found a product URL! Let me generate a viral video for it.",
      action: "generate",
    };
  }

  // If we have a manifest, use the Director to process editing commands
  if (context?.currentManifest) {
    const result = await processDirectorCommand(message, context.currentManifest);
    return {
      response: result.message,
      manifest: result.manifest,
      action: result.actions.length > 0 ? "edit" : undefined,
    };
  }

  // No manifest yet - guide user to paste a URL
  return {
    response:
      "I'm your AI Director! Paste a Shopify or product URL and I'll create a viral video for it. Once generated, you can ask me to change the theme, adjust timing, or modify text.",
  };
}

// Director edit action - directly process a command
export async function directorEdit(
  command: string,
  manifest: VideoManifest
): Promise<DirectorResponse> {
  return processDirectorCommand(command, manifest);
}

// Quick theme switch
export async function switchTheme(
  manifest: VideoManifest,
  themeId: ThemeId
): Promise<VideoManifest> {
  const theme = THEME_PRESETS[themeId];
  if (!theme) return manifest;

  return {
    ...manifest,
    theme,
    clips: manifest.clips.map((clip) => ({
      ...clip,
      transition: theme.transition,
    })),
    captions: manifest.captions.map((caption) => ({
      ...caption,
      style: theme.textAnimation,
    })),
    version: (manifest.version || 1) + 1,
    updatedAt: new Date().toISOString(),
  };
}
