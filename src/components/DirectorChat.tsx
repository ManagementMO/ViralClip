"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Bot, User, Palette, Zap, Crown, Minus } from "lucide-react";
import type { ChatMessage, VideoManifest, ThemeId } from "@/lib/types";
import { THEME_PRESETS } from "@/lib/types";
import { sendChatMessage, switchTheme } from "@/app/actions";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DirectorChatProps {
  onGenerateRequest: (url: string) => void;
  onManifestUpdate: (manifest: VideoManifest) => void;
  currentManifest?: VideoManifest;
  isGenerating: boolean;
}

const THEME_ICONS: Record<ThemeId, React.FC<{ className?: string }>> = {
  cyber: Zap,
  luxe: Crown,
  minimal: Minus,
};

const THEME_LABELS: Record<ThemeId, string> = {
  cyber: "Cyber",
  luxe: "Luxe",
  minimal: "Minimal",
};

export function DirectorChat({
  onGenerateRequest,
  onManifestUpdate,
  currentManifest,
  isGenerating,
}: DirectorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! I'm your AI Director. Paste a Shopify product URL and I'll create a viral video for you. Once generated, ask me to change themes, adjust timing, or modify text!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get current theme from manifest
  const currentThemeId = currentManifest?.theme?.id || "cyber";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      console.log("[UI] Sending chat message:", input.trim());
      console.log("[UI] Current manifest version:", currentManifest?.version);

      const result = await sendChatMessage(input.trim(), {
        currentManifest,
      });

      console.log("[UI] Received result:", {
        action: result.action,
        hasManifest: !!result.manifest,
        manifestVersion: result.manifest?.version,
        manifestTheme: result.manifest?.theme?.id,
      });

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
        manifestVersion: result.manifest?.version,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If action is to generate, extract URL and trigger generation
      if (result.action === "generate") {
        const urlMatch = input.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          onGenerateRequest(urlMatch[0]);
        }
      }

      // If Director made edits, update the manifest
      if (result.action === "edit" && result.manifest) {
        console.log("[UI] Calling onManifestUpdate with new manifest, version:", result.manifest.version);
        onManifestUpdate(result.manifest);
      } else {
        console.log("[UI] NOT updating manifest. action:", result.action, "hasManifest:", !!result.manifest);
      }
    } catch (error) {
      console.error("[UI] Error in sendChatMessage:", error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "Oops! Something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeSwitch = async (themeId: ThemeId) => {
    if (!currentManifest) return;
    setShowThemePicker(false);
    setIsLoading(true);

    try {
      const updatedManifest = await switchTheme(currentManifest, themeId);
      onManifestUpdate(updatedManifest);

      const themeName = THEME_LABELS[themeId];
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: `Switched to ${themeName} theme! ${
          themeId === "cyber"
            ? "Neon colors, glitch effects, and fast cuts for maximum energy."
            : themeId === "luxe"
            ? "Elegant gold tones, smooth fades, and Ken Burns zoom for a premium feel."
            : "Clean slides, subtle animations, and a minimalist aesthetic."
        }`,
        timestamp: new Date(),
        manifestVersion: updatedManifest.version,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "Failed to switch theme. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-neon to-purple-electric flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-semibold text-white">AI Director</h2>
              <p className="text-xs text-zinc-400">Powered by Gemini 3 Flash</p>
            </div>
          </div>

          {/* Theme Picker Button - only show when manifest exists */}
          {currentManifest && (
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  showThemePicker
                    ? "bg-lime-neon text-black"
                    : "bg-white/5 hover:bg-white/10 text-zinc-300"
                )}
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">{THEME_LABELS[currentThemeId]}</span>
              </button>

              {/* Theme Dropdown */}
              <AnimatePresence>
                {showThemePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
                  >
                    {(Object.keys(THEME_PRESETS) as ThemeId[]).map((themeId) => {
                      const Icon = THEME_ICONS[themeId];
                      const theme = THEME_PRESETS[themeId];
                      const isActive = themeId === currentThemeId;

                      return (
                        <button
                          key={themeId}
                          onClick={() => handleThemeSwitch(themeId)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                            isActive
                              ? "bg-white/10 text-white"
                              : "hover:bg-white/5 text-zinc-300"
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: theme.primaryColor + "22",
                              color: theme.primaryColor
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">{theme.name}</div>
                            <div className="text-xs text-zinc-500">
                              {themeId === "cyber"
                                ? "Fast, energetic"
                                : themeId === "luxe"
                                ? "Elegant, premium"
                                : "Clean, subtle"}
                            </div>
                          </div>
                          {isActive && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-lime-neon" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Manifest Version Badge */}
      {currentManifest && (
        <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            Editing: <span className="text-white">{currentManifest.product.title}</span>
          </span>
          <span className="text-zinc-500">
            v{currentManifest.version || 1}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-purple-electric/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-electric" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  message.role === "user"
                    ? "bg-lime-neon text-black"
                    : "bg-white/5 text-white"
                )}
              >
                <p className="text-sm">{message.content}</p>
                {message.manifestVersion && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Updated to v{message.manifestVersion}
                  </p>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-lime-neon/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-lime-neon" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {(isLoading || isGenerating) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-purple-electric/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-electric" />
            </div>
            <div className="bg-white/5 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-electric rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-purple-electric rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-purple-electric rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {currentManifest && (
        <div className="px-4 py-2 border-t border-white/10 flex gap-2 overflow-x-auto">
          {[
            "Make it faster",
            "Make it luxurious",
            "Add more energy",
            "Slow it down",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="flex-shrink-0 px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              currentManifest
                ? "Ask me to change theme, timing, text..."
                : "Paste a product URL or ask me anything..."
            }
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-lime-neon/50 transition-colors"
            disabled={isLoading || isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || isGenerating}
            className={cn(
              "p-3 rounded-xl transition-all",
              input.trim() && !isLoading && !isGenerating
                ? "bg-lime-neon text-black hover:bg-lime-neon/90"
                : "bg-white/5 text-zinc-500 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
