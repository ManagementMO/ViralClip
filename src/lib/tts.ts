const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Default voice ID (Rachel - clear, professional female voice)
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

// Voice presets for different styles - All enthusiastic voices
export const VOICE_PRESETS = {
  hype: {
    voiceId: "ErXwobaYiN019PkySvjV", // Antoni - enthusiastic male
    stability: 0.3,
    similarityBoost: 0.8,
    style: 0.7,
    useSpeakerBoost: true,
  },
  minimal: {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella - enthusiastic female
    stability: 0.3,
    similarityBoost: 0.8,
    style: 0.7,
    useSpeakerBoost: true,
  },
  luxury: {
    voiceId: "onwK4e9ZLuTAKqWW03F9", // Daniel - enthusiastic male (British)
    stability: 0.3,
    similarityBoost: 0.8,
    style: 0.7,
    useSpeakerBoost: true,
  },
  playful: {
    voiceId: "XB0fDUnXU5powFXDhCwa", // Charlotte - British enthusiastic female
    stability: 0.2,
    similarityBoost: 0.9,
    style: 0.9,
    useSpeakerBoost: true,
  },
};

export interface TTSResult {
  audioUrl: string;
  durationMs: number;
}

// Generate speech from text using ElevenLabs API directly
export async function generateSpeech(
  text: string,
  style: keyof typeof VOICE_PRESETS = "hype"
): Promise<TTSResult | null> {
  if (!ELEVENLABS_API_KEY) {
    console.log("No ElevenLabs API key configured - skipping TTS");
    return null;
  }

  const preset = VOICE_PRESETS[style] || VOICE_PRESETS.hype;
  
  return generateSpeechByPreset(text, preset);
}

// Generate speech using a specific preset object
export async function generateSpeechByPreset(
  text: string,
  preset: typeof VOICE_PRESETS[keyof typeof VOICE_PRESETS]
): Promise<TTSResult | null> {
  if (!ELEVENLABS_API_KEY) {
    console.log("No ElevenLabs API key configured - skipping TTS");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${preset.voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: preset.stability,
            similarity_boost: preset.similarityBoost,
            style: preset.style,
            use_speaker_boost: preset.useSpeakerBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs API error:", error);
      return null;
    }

    // Get audio as blob
    const audioBlob = await response.blob();

    // Convert to base64 data URL for use in Remotion
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const audioUrl = `data:audio/mpeg;base64,${base64}`;

    // Estimate duration (rough estimate: ~150ms per word)
    const wordCount = text.split(/\s+/).length;
    const durationMs = wordCount * 150;

    return {
      audioUrl,
      durationMs,
    };
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
}

// Limit text to maximum number of words
function limitWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text.trim();
  }
  return words.slice(0, maxWords).join(" ");
}

// Generate speech optimized for short-form video (faster pacing)
export async function generateVideoVoiceover(
  script: string,
  style: keyof typeof VOICE_PRESETS = "hype"
): Promise<TTSResult | null> {
  // Clean up the script for TTS
  const cleanScript = script
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();

  // Limit to 10 words max for ElevenLabs
  const limitedScript = limitWords(cleanScript, 10);

  return generateSpeech(limitedScript, style);
}
