"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Link2, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { cn, isValidUrl, isShopifyUrl } from "@/lib/utils";

interface ProductUrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function ProductUrlInput({ onSubmit, isLoading }: ProductUrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL");
      return;
    }

    // Note: We accept any URL for demo, but could restrict to Shopify
    onSubmit(url.trim());
  };

  const isShopify = url && isValidUrl(url) && isShopifyUrl(url);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="glass p-6 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white">
            Create Your Viral Video
          </h3>
          <p className="text-sm text-zinc-400">
            Paste a product URL to get started
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Link2
              className={cn(
                "w-5 h-5 transition-colors",
                isShopify ? "text-lime-neon" : "text-zinc-500"
              )}
            />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://your-store.myshopify.com/products/..."
            className={cn(
              "w-full bg-black/40 border rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none transition-all",
              error
                ? "border-red-500/50 focus:border-red-500"
                : "border-white/10 focus:border-lime-neon/50"
            )}
            disabled={isLoading}
          />
          {isShopify && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-y-0 right-4 flex items-center"
            >
              <span className="px-2 py-1 text-xs bg-lime-neon/20 text-lime-neon rounded-md">
                Shopify
              </span>
            </motion.div>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className={cn(
            "w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
            isLoading || !url.trim()
              ? "bg-white/5 text-zinc-500 cursor-not-allowed"
              : "bg-gradient-to-r from-lime-neon to-purple-electric text-black hover:opacity-90"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Video
            </>
          )}
        </button>

        <p className="text-xs text-center text-zinc-500">
          Works with Shopify, WooCommerce, and most e-commerce platforms
        </p>
      </div>
    </form>
  );
}
