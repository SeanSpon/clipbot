"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Maximize2 } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";

interface TheaterProps {
  videoUrl?: string;
  className?: string;
}

export function Theater({ videoUrl, className = "" }: TheaterProps) {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setPlaying = useEditorStore((s) => s.setPlaying);

  const togglePlay = useCallback(() => {
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={`relative overflow-hidden rounded-[var(--radius-panel)] bg-black ${className}`}
    >
      {/* Video area */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-void to-black">
        {videoUrl ? (
          <video
            src={videoUrl}
            className="h-full w-full object-contain"
            playsInline
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4">
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="h-16 w-16 rounded-full bg-white/[0.04] flex items-center justify-center"
            >
              <Play className="h-8 w-8 text-text-muted ml-1" />
            </motion.div>
            <p className="text-sm text-text-muted">
              Select a clip to preview
            </p>
          </div>
        )}

        {/* Vignette overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>

      {/* Transport controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity duration-300 hover:opacity-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 text-white" />
              ) : (
                <Play className="h-4 w-4 text-white ml-0.5" />
              )}
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <Maximize2 className="h-4 w-4 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
