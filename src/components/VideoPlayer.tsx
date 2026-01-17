"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, Download } from "lucide-react";
import { MyComposition } from "../../remotion/MyComposition";
import type { VideoManifest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";

interface VideoPlayerProps {
  manifest: VideoManifest;
}

export function VideoPlayer({ manifest }: VideoPlayerProps) {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);
    player.addEventListener("frameupdate", onFrameUpdate);

    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
      player.removeEventListener("frameupdate", onFrameUpdate);
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPlaying]);

  const handleRestart = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(0);
    player.play();
  }, []);

  const progress = (currentFrame / manifest.durationInFrames) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black/20 rounded-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-lg overflow-hidden shadow-2xl"
          style={{
            aspectRatio: `${manifest.width}/${manifest.height}`,
            maxHeight: "100%",
            maxWidth: "100%",
          }}
        >
          <Player
            ref={playerRef}
            component={MyComposition}
            inputProps={manifest}
            durationInFrames={manifest.durationInFrames}
            fps={manifest.fps}
            compositionWidth={manifest.width}
            compositionHeight={manifest.height}
            style={{
              width: "100%",
              height: "100%",
            }}
            controls={false}
            loop
            autoPlay={false}
          />

          {/* Play overlay when paused */}
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={handlePlayPause}
            >
              <div className="w-16 h-16 rounded-full bg-lime-neon flex items-center justify-center">
                <Play className="w-8 h-8 text-black ml-1" />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3">
        {/* Progress bar */}
        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-lime-neon to-purple-electric"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time display */}
        <div className="flex justify-between text-xs text-zinc-400">
          <span>{formatDuration(currentFrame, manifest.fps)}</span>
          <span>{formatDuration(manifest.durationInFrames, manifest.fps)}</span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleRestart}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-300 hover:text-white"
            title="Restart"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handlePlayPause}
            className={cn(
              "p-4 rounded-full transition-all",
              isPlaying
                ? "bg-white/10 hover:bg-white/20"
                : "bg-lime-neon hover:bg-lime-neon/90 text-black"
            )}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>

          <button
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-300 hover:text-white"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
