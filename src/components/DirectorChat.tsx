"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Bot, User } from "lucide-react";
import type { ChatMessage, VideoManifest } from "@/lib/types";
import { sendChatMessage } from "@/app/actions";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DirectorChatProps {
  onGenerateRequest: (url: string) => void;
  currentManifest?: VideoManifest;
  isGenerating: boolean;
}

export function DirectorChat({
  onGenerateRequest,
  currentManifest,
  isGenerating,
}: DirectorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! I'm your AI Director. Paste a Shopify product URL and I'll create a viral video for you.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const result = await sendChatMessage(input.trim(), {
        currentManifest,
      });

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If action is to generate, extract URL and trigger generation
      if (result.action === "generate") {
        const urlMatch = input.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          onGenerateRequest(urlMatch[0]);
        }
      }
    } catch (error) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-neon to-purple-electric flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="font-semibold text-white">AI Director</h2>
            <p className="text-xs text-zinc-400">Powered by Gemini 2.0</p>
          </div>
        </div>
      </div>

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

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a product URL or ask me anything..."
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
