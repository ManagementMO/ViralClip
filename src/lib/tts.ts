const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Default voice ID (Rachel - clear, professional female voice)
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

// Voice presets for different styles
export const VOICE_PRESETS = {
  hype: {
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam - energetic male
    stability: 0.3,
    similarityBoost: 0.8,
    style: 0.5,
    useSpeakerBoost: true,
  },
  minimal: {
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel - calm female
    stability: 0.7,
    similarityBoost: 0.5,
    style: 0.2,
    useSpeakerBoost: false,
  },
  luxury: {
    voiceId: "D38z5RcWu1voky8WS1ja", // Fin - sophisticated male
    stability: 0.6,
    similarityBoost: 0.6,
    style: 0.3,
    useSpeakerBoost: false,
  },
  playful: {
    voiceId: "jBpfuIE2acCO8z3wKNLl", // Gigi - cheerful female
    stability: 0.4,
    similarityBoost: 0.7,
    style: 0.6,
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

  return generateSpeech(cleanScript, style);
}
