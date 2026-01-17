"use server";

import { GoogleGenAI } from "@google/genai";
import type {
  VideoManifest,
  GenerateVideoResponse,
  ScrapedProduct,
} from "@/lib/types";
import { MOCK_MANIFEST, MOCK_PRODUCT } from "@/lib/mock-data";
import { generateId, secondsToFrames } from "@/lib/utils";

// Initialize Google GenAI client
const getGenAI = () => {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Mock product scraping (will be replaced with actual scraping)
async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  // In production, this would use Puppeteer or a scraping API
  // For now, return mock data with URL validation
  console.log(`[Mock] Scraping product from: ${url}`);

  return {
    ...MOCK_PRODUCT,
    images: [MOCK_PRODUCT.image],
  };
}

// Generate script and captions using Gemini
async function generateScriptWithGemini(
  product: ScrapedProduct,
  style: string = "hype"
): Promise<{ script: string; captions: VideoManifest["captions"] }> {
  const ai = getGenAI();

  if (!ai) {
    console.log("[Mock] No API key, returning mock captions");
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

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        script: parsed.script,
        captions: parsed.captions,
      };
    }

    throw new Error("Could not parse Gemini response");
  } catch (error) {
    console.error("Gemini API error:", error);
    // Fallback to mock data
    return {
      script: MOCK_MANIFEST.script,
      captions: MOCK_MANIFEST.captions,
    };
  }
}

// Main video generation action
export async function generateVideo(
  productUrl: string,
  style: string = "hype"
): Promise<GenerateVideoResponse> {
  try {
    // Step 1: Scrape product details
    console.log("Step 1: Scraping product...");
    const product = await scrapeProduct(productUrl);

    // Step 2: Generate script and captions with Gemini
    console.log("Step 2: Generating script with AI...");
    const { script, captions } = await generateScriptWithGemini(product, style);

    // Step 3: Build video manifest
    const manifest: VideoManifest = {
      id: generateId(),
      script,
      audioUrl: undefined, // Will be populated by ElevenLabs in Phase E
      fps: 30,
      durationInFrames: 300, // 10 seconds
      width: 1080,
      height: 1920,
      captions,
      clips: MOCK_MANIFEST.clips, // Use mock clips for now
      product: {
        title: product.title,
        price: product.price,
        image: product.image,
        description: product.description,
        url: productUrl,
      },
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      manifest,
    };
  } catch (error) {
    console.error("Video generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Chat action for AI Director
export async function sendChatMessage(
  message: string,
  context?: { productUrl?: string; currentManifest?: VideoManifest }
): Promise<{ response: string; action?: string; manifest?: VideoManifest }> {
  const ai = getGenAI();

  if (!ai) {
    // Mock response without API key
    if (message.toLowerCase().includes("http")) {
      return {
        response:
          "I found a product URL in your message! Let me generate a viral video for it. (Note: Running in demo mode without API key)",
        action: "generate",
      };
    }
    return {
      response:
        "I'm your AI Director! Paste a Shopify product URL and I'll create a viral video for it. (Running in demo mode)",
    };
  }

  const systemPrompt = `You are an AI Video Director for ViralClip, helping merchants create viral marketing videos.
Your personality: Creative, enthusiastic, knowledgeable about viral content and social media trends.

Current context:
- Product URL: ${context?.productUrl || "Not set"}
- Has video: ${context?.currentManifest ? "Yes" : "No"}

Your capabilities:
1. Help users understand the video creation process
2. Suggest improvements to their video
3. Explain different styles (hype, minimal, luxury, playful)
4. Detect product URLs and trigger video generation

If the user's message contains a URL, respond with enthusiasm and indicate you'll start generating.
Keep responses concise (2-3 sentences max).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: message }] },
      ],
    });

    const text = response.text || "I'm here to help create viral videos!";

    // Check if message contains URL
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return {
        response: text,
        action: "generate",
      };
    }

    return { response: text };
  } catch (error) {
    console.error("Chat error:", error);
    return {
      response:
        "I had trouble processing that. Could you try again? Or paste a product URL to get started!",
    };
  }
}
