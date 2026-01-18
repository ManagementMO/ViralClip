"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Zap, Video, Wand2, ArrowLeft } from "lucide-react";
import { DirectorChat } from "@/components/DirectorChat";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ProductUrlInput } from "@/components/ProductUrlInput";
import { generateVideo } from "@/app/actions";
import { MOCK_MANIFEST } from "@/lib/mock-data";
import type { VideoManifest } from "@/lib/types";

export default function Home() {
  const [manifest, setManifest] = useState<VideoManifest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (url: string, voice: string = "hype") => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateVideo(url, "hype", voice);

      if (result.success && result.manifest) {
        setManifest(result.manifest);
      } else {
        setError(result.error || "Failed to generate video");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleLoadDemo = useCallback(() => {
    setManifest(MOCK_MANIFEST);
  }, []);

  const handleBack = useCallback(() => {
    setManifest(null);
    setError(null);
  }, []);

  const handleManifestUpdate = useCallback((updatedManifest: VideoManifest) => {
    setManifest(updatedManifest);
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-neon to-purple-electric flex items-center justify-center">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">ViralClip</h1>
              <p className="text-xs text-zinc-500">AI Video Engine</p>
            </div>
          </div>

          {manifest ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-zinc-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              New Video
            </button>
          ) : (
            <button
              onClick={handleLoadDemo}
              className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-zinc-300 hover:text-white"
            >
              Load Demo
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        {!manifest ? (
          // Landing / URL Input View
          <div className="h-full flex flex-col items-center justify-center py-12 space-y-12">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4 max-w-2xl"
            >
              <h2 className="text-4xl md:text-5xl font-bold">
                Turn Products into{" "}
                <span className="gradient-text">Viral Videos</span>
              </h2>
              <p className="text-lg text-zinc-400">
                AI-powered video generation for Shopify merchants. Create
                scroll-stopping content.
              </p>
            </motion.div>

            {/* URL Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full"
            >
              <ProductUrlInput
                onSubmit={handleGenerate}
                isLoading={isGenerating}
              />
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-3"
            >
              {[
                { icon: Video, label: "Auto Video Editing" },
                { icon: Wand2, label: "AI Captions" },
                { icon: Zap, label: "Instant Export" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-zinc-400"
                >
                  <Icon className="w-4 h-4 text-lime-neon" />
                  {label}
                </div>
              ))}
            </motion.div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-dark px-6 py-4 text-red-400 text-sm max-w-md text-center"
              >
                {error}
              </motion.div>
            )}
          </div>
        ) : (
          // Editor View - Split Screen
          <div className="h-[calc(100vh-120px)] grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - AI Director Chat */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-dark overflow-hidden flex flex-col"
            >
              <DirectorChat
                onGenerateRequest={handleGenerate}
                onManifestUpdate={handleManifestUpdate}
                currentManifest={manifest}
                isGenerating={isGenerating}
              />
            </motion.div>

            {/* Right Panel - Video Player */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-dark overflow-hidden flex flex-col min-h-0"
            >
              <div className="p-4 border-b border-white/10 shrink-0">
                <h2 className="font-semibold text-white">Preview</h2>
                <p className="text-xs text-zinc-400">
                  {manifest.product.title}
                </p>
              </div>
              <div className="flex-1 min-h-0 p-4">
                <VideoPlayer manifest={manifest} />
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4">
        <div className="container mx-auto px-4 text-center text-xs text-zinc-500">
          Built with Next.js 16, Remotion 4.0, and Gemini 3 Flash
        </div>
      </footer>
    </main>
  );
}
