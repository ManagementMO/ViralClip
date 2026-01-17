import { GoogleGenAI } from "@google/genai";
import type {
  VideoManifest,
  DirectorAction,
  DirectorResponse,
  Theme,
  ThemeId,
  Clip,
} from "./types";
import { THEME_PRESETS } from "./types";
import {
  isTwelveLabsConfigured,
  smartSearch,
  createMockVideoIndex,
} from "./twelvelabs";

// Initialize Google GenAI client with Gemini 2.5 Flash
const getGenAI = () => {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// Available Director actions
const DIRECTOR_ACTIONS = [
  "change_theme",
  "update_clip",
  "search_video",
  "change_music",
  "update_text",
  "adjust_timing",
  "regenerate_script",
] as const;

// Parse AI response to extract JSON
function extractJSON<T>(text: string): T | null {
  // Try to find JSON in markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {
      // Continue to next method
    }
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      // Return null if parsing fails
    }
  }

  return null;
}

// Build the Director system prompt
function buildDirectorPrompt(manifest: VideoManifest): string {
  return `You are the AI Director for ViralClip, a video editing AI. You modify video projects through natural language.

CURRENT VIDEO MANIFEST:
${JSON.stringify(manifest, null, 2)}

AVAILABLE THEMES:
- cyber: Neon green/pink, fast cuts, glitch effects, techno music, Oswald font
- luxe: Gold/black, slow elegant fades, Ken Burns zoom, classical music, Playfair Display font
- minimal: White/gray, clean slides, typewriter text, lofi music, Inter font

AVAILABLE ACTIONS:
1. change_theme: Switch to a different theme preset
2. update_clip: Modify a specific clip (timing, source)
3. search_video: Find a specific moment in the video (requires TwelveLabs)
4. change_music: Change background music genre
5. update_text: Modify captions or script text
6. adjust_timing: Change clip/caption durations
7. regenerate_script: Create new script content

RESPONSE FORMAT:
Return ONLY a JSON object with this structure:
{
  "actions": [
    {
      "type": "action_type",
      "payload": { /* action-specific data */ },
      "reasoning": "Why you're making this change"
    }
  ],
  "message": "Friendly response to the user explaining what you did",
  "manifestChanges": {
    // Only include fields that need to change
    // e.g., "theme": { full theme object }
  }
}

EXAMPLES:

User: "Make it feel more luxurious"
{
  "actions": [{"type": "change_theme", "payload": {"themeId": "luxe"}, "reasoning": "User wants luxury aesthetic"}],
  "message": "I've switched to the Luxe theme - elegant gold tones, smooth fades, and classical background music. The Ken Burns effect will add a cinematic touch.",
  "manifestChanges": {"theme": ${JSON.stringify(THEME_PRESETS.luxe)}}
}

User: "Speed up the cuts"
{
  "actions": [{"type": "adjust_timing", "payload": {"clipDuration": 30}, "reasoning": "Faster cuts requested"}],
  "message": "Done! I've shortened each clip to create a faster, more dynamic pace.",
  "manifestChanges": {"theme": {"clipDuration": 30}}
}

User: "Change the first line to SAY GOODBYE TO BORING"
{
  "actions": [{"type": "update_text", "payload": {"captionIndex": 0, "newText": "SAY GOODBYE TO BORING"}, "reasoning": "User requested text change"}],
  "message": "Updated! The opening line now reads 'SAY GOODBYE TO BORING'.",
  "manifestChanges": {"captions": [{"startFrame": 0, "endFrame": 60, "text": "SAY GOODBYE TO BORING", "style": "impact", "position": "center"}]}
}

Be creative but precise. Only modify what the user asks for. Always explain your changes.`;
}

// Apply theme changes to manifest
function applyTheme(manifest: VideoManifest, themeId: ThemeId): VideoManifest {
  const theme = THEME_PRESETS[themeId];
  if (!theme) return manifest;

  // Update clips with theme-appropriate transition
  const updatedClips = manifest.clips.map((clip) => ({
    ...clip,
    transition: theme.transition,
  }));

  // Update captions with theme-appropriate style
  const updatedCaptions = manifest.captions.map((caption) => ({
    ...caption,
    style: theme.textAnimation,
  }));

  return {
    ...manifest,
    theme,
    clips: updatedClips,
    captions: updatedCaptions,
    updatedAt: new Date().toISOString(),
  };
}

// Apply timing changes to manifest
function adjustTiming(
  manifest: VideoManifest,
  clipDuration: number
): VideoManifest {
  const numClips = manifest.clips.length;
  if (numClips === 0) return manifest;

  const totalFrames = manifest.durationInFrames;
  const actualClipDuration = Math.min(clipDuration, Math.floor(totalFrames / numClips));

  const updatedClips: Clip[] = manifest.clips.map((clip, index) => ({
    ...clip,
    startFrame: index * actualClipDuration,
    duration: actualClipDuration,
  }));

  return {
    ...manifest,
    clips: updatedClips,
    updatedAt: new Date().toISOString(),
  };
}

// Update a specific caption
function updateCaption(
  manifest: VideoManifest,
  captionIndex: number,
  newText: string
): VideoManifest {
  if (captionIndex < 0 || captionIndex >= manifest.captions.length) {
    return manifest;
  }

  const updatedCaptions = [...manifest.captions];
  updatedCaptions[captionIndex] = {
    ...updatedCaptions[captionIndex],
    text: newText,
  };

  // Also update the script to reflect caption changes
  const script = updatedCaptions.map((c) => c.text).join("\n");

  return {
    ...manifest,
    captions: updatedCaptions,
    script,
    updatedAt: new Date().toISOString(),
  };
}

// Search for a video segment using TwelveLabs
async function searchVideoSegment(
  manifest: VideoManifest,
  query: string
): Promise<{ manifest: VideoManifest; found: boolean; segment?: { startTime: number; endTime: number } }> {
  // Check if we have a video index
  if (!manifest.videoIndex?.videoId) {
    // Create mock index if no real one exists
    if (manifest.product?.videoUrl) {
      manifest.videoIndex = createMockVideoIndex(manifest.product.videoUrl, 30);
    } else {
      return { manifest, found: false };
    }
  }

  if (isTwelveLabsConfigured()) {
    try {
      const segment = await smartSearch(manifest.videoIndex.videoId, query);
      if (segment) {
        return {
          manifest,
          found: true,
          segment: { startTime: segment.startTime, endTime: segment.endTime },
        };
      }
    } catch {
      // Fall through to mock search
    }
  }

  // Mock search - look through existing segments
  const matchingSegment = manifest.videoIndex.segments.find(
    (s) => s.label.toLowerCase().includes(query.toLowerCase())
  );

  if (matchingSegment) {
    return {
      manifest,
      found: true,
      segment: { startTime: matchingSegment.startTime, endTime: matchingSegment.endTime },
    };
  }

  return { manifest, found: false };
}

// Main Director function
export async function processDirectorCommand(
  userMessage: string,
  currentManifest: VideoManifest
): Promise<DirectorResponse> {
  const ai = getGenAI();

  // Default response for demo mode
  if (!ai) {
    // Handle common commands in demo mode
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("luxe") || lowerMessage.includes("luxury")) {
      const updatedManifest = applyTheme(currentManifest, "luxe");
      return {
        manifest: updatedManifest,
        actions: [
          {
            type: "change_theme",
            payload: { themeId: "luxe" },
            reasoning: "User requested luxury aesthetic",
          },
        ],
        message:
          "I've applied the Luxe theme! Gold tones, elegant fades, and Ken Burns zoom effects for a premium feel. (Demo mode)",
      };
    }

    if (lowerMessage.includes("cyber") || lowerMessage.includes("neon")) {
      const updatedManifest = applyTheme(currentManifest, "cyber");
      return {
        manifest: updatedManifest,
        actions: [
          {
            type: "change_theme",
            payload: { themeId: "cyber" },
            reasoning: "User requested cyberpunk aesthetic",
          },
        ],
        message:
          "Switched to Cyber theme! Neon colors, glitch effects, and fast cuts for maximum energy. (Demo mode)",
      };
    }

    if (lowerMessage.includes("minimal") || lowerMessage.includes("clean")) {
      const updatedManifest = applyTheme(currentManifest, "minimal");
      return {
        manifest: updatedManifest,
        actions: [
          {
            type: "change_theme",
            payload: { themeId: "minimal" },
            reasoning: "User requested minimal aesthetic",
          },
        ],
        message:
          "Applied Minimal theme! Clean slides, typewriter text, and lofi vibes. (Demo mode)",
      };
    }

    if (lowerMessage.includes("faster") || lowerMessage.includes("speed up")) {
      const updatedManifest = adjustTiming(currentManifest, 30);
      return {
        manifest: updatedManifest,
        actions: [
          {
            type: "adjust_timing",
            payload: { clipDuration: 30 },
            reasoning: "User wants faster pace",
          },
        ],
        message: "Done! Clips are now faster for a more dynamic feel. (Demo mode)",
      };
    }

    if (lowerMessage.includes("slower") || lowerMessage.includes("slow down")) {
      const updatedManifest = adjustTiming(currentManifest, 90);
      return {
        manifest: updatedManifest,
        actions: [
          {
            type: "adjust_timing",
            payload: { clipDuration: 90 },
            reasoning: "User wants slower pace",
          },
        ],
        message:
          "Slowed things down for a more cinematic, luxurious feel. (Demo mode)",
      };
    }

    return {
      manifest: currentManifest,
      actions: [],
      message:
        "I'm your AI Director! Try asking me to change the theme (cyber, luxe, minimal), adjust the pacing, or modify text. (Demo mode - add GOOGLE_GENAI_API_KEY for full capabilities)",
    };
  }

  // Use Gemini to process the command
  try {
    const prompt = buildDirectorPrompt(currentManifest);

    // Try gemini-2.0-flash first, fall back to gemini-1.5-flash if rate limited
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `${prompt}\n\nUser command: ${userMessage}`,
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'status' in e && e.status === 429) {
        console.log("Rate limited on 2.0-flash, trying 1.5-flash...");
        response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: `${prompt}\n\nUser command: ${userMessage}`,
        });
      } else {
        throw e;
      }
    }

    const text = response.text?.trim() || "";
    const parsed = extractJSON<{
      actions?: DirectorAction[];
      message?: string;
      manifestChanges?: Partial<VideoManifest>;
    }>(text);

    if (!parsed) {
      return {
        manifest: currentManifest,
        actions: [],
        message:
          "I understood your request but had trouble processing it. Could you try rephrasing?",
      };
    }

    // Apply manifest changes
    let updatedManifest = { ...currentManifest };

    // Process each action
    for (const action of parsed.actions || []) {
      switch (action.type) {
        case "change_theme": {
          const themeId = action.payload?.themeId as ThemeId;
          if (themeId && THEME_PRESETS[themeId]) {
            updatedManifest = applyTheme(updatedManifest, themeId);
          }
          break;
        }
        case "adjust_timing": {
          const clipDuration = action.payload?.clipDuration as number;
          if (clipDuration && clipDuration > 0) {
            updatedManifest = adjustTiming(updatedManifest, clipDuration);
          }
          break;
        }
        case "update_text": {
          const captionIndex = action.payload?.captionIndex as number;
          const newText = action.payload?.newText as string;
          if (typeof captionIndex === "number" && newText) {
            updatedManifest = updateCaption(updatedManifest, captionIndex, newText);
          }
          break;
        }
        case "search_video": {
          const query = action.payload?.query as string;
          if (query) {
            const result = await searchVideoSegment(updatedManifest, query);
            updatedManifest = result.manifest;
            if (result.found && result.segment) {
              // Could add the found segment as a new clip
            }
          }
          break;
        }
      }
    }

    // Apply any direct manifest changes from AI
    if (parsed.manifestChanges) {
      // Handle theme changes
      if (parsed.manifestChanges.theme) {
        updatedManifest.theme = parsed.manifestChanges.theme as Theme;
      }

      // Handle caption updates
      if (parsed.manifestChanges.captions) {
        // Merge caption updates
        const newCaptions = parsed.manifestChanges.captions;
        if (Array.isArray(newCaptions) && newCaptions.length > 0) {
          // If it's a partial update (fewer captions), merge with existing
          if (newCaptions.length < updatedManifest.captions.length) {
            updatedManifest.captions = updatedManifest.captions.map((caption, idx) =>
              newCaptions[idx] ? { ...caption, ...newCaptions[idx] } : caption
            );
          } else {
            updatedManifest.captions = newCaptions;
          }
        }
      }

      // Handle clip updates
      if (parsed.manifestChanges.clips) {
        updatedManifest.clips = parsed.manifestChanges.clips;
      }

      // Handle script updates
      if (parsed.manifestChanges.script) {
        updatedManifest.script = parsed.manifestChanges.script;
      }
    }

    updatedManifest.version = (currentManifest.version || 1) + 1;
    updatedManifest.updatedAt = new Date().toISOString();

    return {
      manifest: updatedManifest,
      actions: parsed.actions || [],
      message: parsed.message || "I've made the changes you requested!",
    };
  } catch (error) {
    console.error("Director error:", error);
    return {
      manifest: currentManifest,
      actions: [],
      message:
        "I encountered an error processing your request. Please try again.",
    };
  }
}

// Quick theme change helper
export function quickThemeChange(
  manifest: VideoManifest,
  themeId: ThemeId
): VideoManifest {
  return applyTheme(manifest, themeId);
}

// Get theme suggestions based on product
export function suggestTheme(productTitle: string): ThemeId {
  const title = productTitle.toLowerCase();

  if (
    title.includes("luxury") ||
    title.includes("premium") ||
    title.includes("gold") ||
    title.includes("diamond")
  ) {
    return "luxe";
  }

  if (
    title.includes("tech") ||
    title.includes("gaming") ||
    title.includes("neon") ||
    title.includes("rgb")
  ) {
    return "cyber";
  }

  return "minimal";
}
