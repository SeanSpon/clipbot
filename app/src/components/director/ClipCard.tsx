"use client";

import { motion } from "framer-motion";
import { Play, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import type { Clip } from "@/types";

interface ClipCardProps {
  clip: Clip;
  index: number;
  onSelect?: (clipId: string) => void;
  onApprove?: (clipId: string) => void;
  onReject?: (clipId: string) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function scoreColor(score: number): string {
  if (score >= 8) return "text-cyan-glow";
  if (score >= 6) return "text-violet-glow";
  return "text-text-secondary";
}

function scoreGlow(score: number): string {
  if (score >= 8) return "shadow-[0_0_15px_rgba(6,182,212,0.4)]";
  if (score >= 6) return "shadow-[0_0_15px_rgba(139,92,246,0.3)]";
  return "";
}

export function ClipCard({
  clip,
  index,
  onSelect,
  onApprove,
  onReject,
}: ClipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.6,
        delay: index * 0.12,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className="group relative"
    >
      <div
        className={`
          relative overflow-hidden rounded-[var(--radius-card)]
          border border-white/[0.06] bg-white/[0.03] backdrop-blur-md
          transition-all duration-300
          hover:border-white/[0.12] hover:bg-white/[0.05]
          ${scoreGlow(clip.score)}
        `}
      >
        {/* Thumbnail / preview area */}
        <div
          className="relative aspect-video w-full bg-gradient-to-br from-void-lighter to-void cursor-pointer"
          onClick={() => onSelect?.(clip.id)}
        >
          {clip.thumbnailUrl ? (
            <img
              src={clip.thumbnailUrl}
              alt={clip.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film className="h-8 w-8 text-text-muted" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
            >
              <Play className="h-5 w-5 text-white fill-white" />
            </motion.div>
          </div>

          {/* Score badge */}
          <div className="absolute right-3 top-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.12 + 0.3, type: "spring" }}
              className={`
                flex h-9 w-9 items-center justify-center rounded-full
                bg-black/60 backdrop-blur-sm font-display text-sm font-bold
                ${scoreColor(clip.score)}
              `}
            >
              {clip.score}
            </motion.div>
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
            <Clock className="h-3 w-3 text-text-muted" />
            <span className="text-xs text-text-secondary">
              {formatDuration(clip.duration)}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-display text-sm font-semibold text-text-primary truncate">
            {clip.title}
          </h3>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onApprove?.(clip.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-[var(--radius-button)] py-2 text-xs font-medium transition-all duration-200
                ${
                  clip.status === "approved"
                    ? "bg-cyan/20 text-cyan border border-cyan/30"
                    : "bg-white/[0.04] text-text-secondary hover:bg-cyan/10 hover:text-cyan border border-transparent"
                }
              `}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Keep
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onReject?.(clip.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-[var(--radius-button)] py-2 text-xs font-medium transition-all duration-200
                ${
                  clip.status === "rejected"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-white/[0.04] text-text-secondary hover:bg-red-500/10 hover:text-red-400 border border-transparent"
                }
              `}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              Cut
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// needed for thumbnail fallback
function Film(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 3v18M17 3v18M3 7.5h4M17 7.5h4M3 12h18M3 16.5h4M17 16.5h4" />
    </svg>
  );
}
