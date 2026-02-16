"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ChevronRight, Tag } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { CinematicLoader } from "@/components/ui/CinematicLoader";

interface FileWithLabel {
  file: File;
  label: string;
  progress: number;
  uploaded: boolean;
}

interface CameraSetupProps {
  files: File[];
  onComplete: (labeled: { file: File; label: string }[]) => void;
  uploadProgress: Record<string, number>;
  isUploading: boolean;
}

const SUGGESTED_LABELS = [
  "Wide Shot",
  "Close-Up",
  "Camera A",
  "Camera B",
  "Camera C",
  "Screen Share",
  "Overhead",
  "Side Angle",
];

export function CameraSetup({
  files,
  onComplete,
  uploadProgress,
  isUploading,
}: CameraSetupProps) {
  const [labeled, setLabeled] = useState<FileWithLabel[]>(
    files.map((f) => ({
      file: f,
      label: "",
      progress: 0,
      uploaded: false,
    })),
  );

  const updateLabel = (index: number, label: string) => {
    setLabeled((prev) =>
      prev.map((item, i) => (i === index ? { ...item, label } : item)),
    );
  };

  const allLabeled = labeled.every((item) => item.label.trim().length > 0);

  const handleContinue = () => {
    if (!allLabeled) return;
    onComplete(labeled.map((l) => ({ file: l.file, label: l.label })));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="mx-auto w-full max-w-xl space-y-6"
    >
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Label Your Cameras
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Give each file a camera angle label so the AI knows what it is working with.
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {labeled.map((item, index) => {
            const progress = uploadProgress[item.file.name] ?? 0;

            return (
              <motion.div
                key={item.file.name}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <GlassPanel hover padding="md" className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-button)] bg-violet/10">
                      <Camera className="h-5 w-5 text-violet" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>

                  {/* Label input */}
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="e.g. Wide Shot, Camera A..."
                      value={item.label}
                      onChange={(e) => updateLabel(index, e.target.value)}
                      className="w-full rounded-[var(--radius-button)] border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-cyan/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-cyan/20"
                    />
                  </div>

                  {/* Suggested labels */}
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_LABELS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => updateLabel(index, suggestion)}
                        className={`rounded-full px-3 py-1 text-xs transition-all duration-200
                          ${
                            item.label === suggestion
                              ? "bg-cyan/20 text-cyan border border-cyan/30"
                              : "bg-white/[0.04] text-text-secondary border border-transparent hover:bg-white/[0.08] hover:text-text-primary"
                          }
                        `}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  {/* Upload progress */}
                  {isUploading && (
                    <CinematicLoader
                      progress={progress}
                      stage={progress >= 100 ? "Uploaded" : "Uploading..."}
                    />
                  )}
                </GlassPanel>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center pt-2"
      >
        <GlowButton
          variant="cyan"
          size="lg"
          disabled={!allLabeled || isUploading}
          loading={isUploading}
          icon={<ChevronRight className="h-5 w-5" />}
          onClick={handleContinue}
        >
          {isUploading ? "Uploading..." : "Start AI Director"}
        </GlowButton>
      </motion.div>
    </motion.div>
  );
}
