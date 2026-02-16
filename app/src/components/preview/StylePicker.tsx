"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Palette, X } from "lucide-react";
import { useEditorStore, type StylePreset } from "@/stores/editor-store";

const PRESETS: { id: StylePreset; label: string; description: string; gradient: string }[] = [
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Letterbox, warm tones, smooth transitions",
    gradient: "from-amber-600/30 to-orange-900/30",
  },
  {
    id: "podcast",
    label: "Podcast",
    description: "Clean cuts, speaker focus, lower thirds",
    gradient: "from-blue-600/30 to-indigo-900/30",
  },
  {
    id: "vlog",
    label: "Vlog",
    description: "Dynamic zoom, quick cuts, energetic",
    gradient: "from-pink-600/30 to-rose-900/30",
  },
  {
    id: "shorts",
    label: "Shorts / Reels",
    description: "9:16 vertical, bold captions, fast pace",
    gradient: "from-red-600/30 to-red-900/30",
  },
  {
    id: "documentary",
    label: "Documentary",
    description: "Wide shots, slow dissolves, narration-first",
    gradient: "from-emerald-600/30 to-teal-900/30",
  },
  {
    id: "raw",
    label: "Raw",
    description: "Minimal processing, authentic feel",
    gradient: "from-gray-600/30 to-gray-900/30",
  },
];

export function StylePicker() {
  const showStylePicker = useEditorStore((s) => s.showStylePicker);
  const toggleStylePicker = useEditorStore((s) => s.toggleStylePicker);
  const selectedPreset = useEditorStore((s) => s.selectedPreset);
  const setPreset = useEditorStore((s) => s.setPreset);

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleStylePicker}
        className="flex items-center gap-2 rounded-[var(--radius-button)] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-text-secondary transition-all hover:border-violet/30 hover:bg-violet/[0.05] hover:text-violet-glow"
      >
        <Palette className="h-4 w-4" />
        Style: {PRESETS.find((p) => p.id === selectedPreset)?.label}
      </motion.button>

      {/* Picker panel */}
      <AnimatePresence>
        {showStylePicker && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-full left-0 right-0 mb-3 rounded-[var(--radius-panel)] border border-white/[0.08] bg-void-light/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-display text-sm font-semibold text-text-primary">
                Choose Style
              </h4>
              <button
                onClick={toggleStylePicker}
                className="rounded-full p-1 text-text-muted hover:bg-white/10 hover:text-text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <motion.button
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setPreset(preset.id);
                    toggleStylePicker();
                  }}
                  className={`relative overflow-hidden rounded-[var(--radius-card)] border p-3 text-left transition-all duration-200
                    ${
                      selectedPreset === preset.id
                        ? "border-violet/40 bg-violet/[0.08]"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                    }
                  `}
                >
                  {/* Gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${preset.gradient} opacity-30`}
                  />

                  <div className="relative">
                    <p className="text-sm font-medium text-text-primary">
                      {preset.label}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
                      {preset.description}
                    </p>
                  </div>

                  {selectedPreset === preset.id && (
                    <motion.div
                      layoutId="preset-indicator"
                      className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
