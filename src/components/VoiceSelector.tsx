"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Volume2, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TTSResult } from "@/lib/tts";

export type VoiceId = "hype" | "minimal" | "luxury" | "playful";

interface VoiceOption {
  id: VoiceId;
  name: string;
  description: string;
  voiceId: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "hype",
    name: "Evan",
    description: "Enthusiastic male",
    voiceId: "ErXwobaYiN019PkySvjV",
  },
  {
    id: "minimal",
    name: "Angela",
    description: "Enthusiastic female",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
  },
  {
    id: "luxury",
    name: "Curtis",
    description: "Enthusiastic male (British)",
    voiceId: "onwK4e9ZLuTAKqWW03F9",
  },
  {
    id: "playful",
    name: "Larissa",
    description: "Enthusiastic female (British)",
    voiceId: "XB0fDUnXU5powFXDhCwa",
  },
];

interface VoiceSelectorProps {
  selectedVoice: VoiceId;
  onVoiceChange: (voice: VoiceId) => void;
}

export function VoiceSelector({ selectedVoice, onVoiceChange }: VoiceSelectorProps) {
  const [previewingVoice, setPreviewingVoice] = useState<VoiceOption | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [previewLoading, setPreviewLoading] = useState<VoiceOption | null>(null);

  const handlePreview = async (voice: VoiceOption) => {
    // Stop current preview if playing
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
    }

    if (previewingVoice === voice.id) {
      // If clicking the same voice, stop it
      setPreviewingVoice(null);
      return;
    }

    setPreviewLoading(voice.id);
    setPreviewingVoice(voice.id);

    try {
      // Generate preview audio
      const response = await fetch("/api/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: voice.voiceId,
          text: "Check out this amazing product",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate preview");

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setPreviewingVoice(null);
        setPreviewAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPreviewingVoice(null);
        setPreviewLoading(null);
        setPreviewAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      setPreviewAudio(audio);
      setPreviewLoading(null);
      await audio.play();
    } catch (error) {
      console.error("Preview error:", error);
      setPreviewingVoice(null);
      setPreviewLoading(null);
    }
  };

  const stopPreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
    }
    setPreviewingVoice(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Volume2 className="w-4 h-4" />
        <span>Choose a voice</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {VOICE_OPTIONS.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isPreviewing = previewingVoice === voice.id;
          const isLoading = previewLoading === voice.id;

          return (
            <motion.button
              key={voice.id}
              type="button"
              onClick={() => onVoiceChange(voice.id)}
              onMouseEnter={() => {
                // Auto-preview on hover (optional)
              }}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-lime-neon bg-lime-neon/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white text-sm">{voice.name}</h4>
                    {isSelected && (
                      <Check className="w-4 h-4 text-lime-neon flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">{voice.description}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPreviewing) {
                      stopPreview();
                    } else {
                      handlePreview(voice);
                    }
                  }}
                  className={cn(
                    "p-2 rounded-lg transition-colors flex-shrink-0",
                    isPreviewing
                      ? "bg-lime-neon/20 text-lime-neon"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPreviewing ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
