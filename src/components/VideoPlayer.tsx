"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, Download } from "lucide-react";
import { MyComposition } from "../../remotion/MyComposition";
import type { VideoManifest } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";

interface VideoPlayerProps {
  manifest: VideoManifest;
}

export function VideoPlayer({ manifest }: VideoPlayerProps) {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showDownloadHint, setShowDownloadHint] = useState(false);

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

  const handleDownload = useCallback(() => {
    // Show hint that export is coming soon
    setShowDownloadHint(true);
    setTimeout(() => setShowDownloadHint(false), 2000);
  }, []);

  const progress = (currentFrame / manifest.durationInFrames) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black/20 rounded-xl relative">
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
                <Play className="w-8 h-8 text-black" fill="currentColor" />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Download hint toast */}
        {showDownloadHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-800 text-white text-sm rounded-lg shadow-lg"
          >
            Export coming soon!
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3">
        {/* Progress bar */}
        <div
          className="relative h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const frame = Math.floor(percentage * manifest.durationInFrames);
            playerRef.current?.seekTo(frame);
          }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-lime-neon to-purple-electric rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time display */}
        <div className="flex justify-between text-xs text-zinc-400 font-mono">
          <span>{formatDuration(currentFrame, manifest.fps)}</span>
          <span>{formatDuration(manifest.durationInFrames, manifest.fps)}</span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleRestart}
            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
            title="Restart"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handlePlayPause}
            className={cn(
              "p-4 rounded-full transition-all shadow-lg",
              isPlaying
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-lime-neon hover:bg-lime-neon/90 text-black"
            )}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6" fill="currentColor" />
            )}
          </button>

          <button
            onClick={handleDownload}
            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
            title="Download video"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
