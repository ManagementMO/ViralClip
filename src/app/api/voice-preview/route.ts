import { NextRequest, NextResponse } from "next/server";
import { generateSpeechByPreset, VOICE_PRESETS } from "@/lib/tts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voiceId, text } = body;

    if (!voiceId || !text) {
      return NextResponse.json(
        { error: "Missing voiceId or text" },
        { status: 400 }
      );
    }

    // Find the voice preset by voiceId
    let preset = null;
    for (const p of Object.values(VOICE_PRESETS)) {
      if (p.voiceId === voiceId) {
        preset = p;
        break;
      }
    }

    if (!preset) {
      return NextResponse.json(
        { error: "Invalid voice ID" },
        { status: 400 }
      );
    }

    // Generate speech with the specific voice preset
    const result = await generateSpeechByPreset(text, preset);

    if (!result || !result.audioUrl) {
      return NextResponse.json(
        { error: "Failed to generate audio" },
        { status: 500 }
      );
    }

    // Convert base64 data URL to blob
    const base64Data = result.audioUrl.split(",")[1];
    const audioBuffer = Buffer.from(base64Data, "base64");

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Voice preview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
