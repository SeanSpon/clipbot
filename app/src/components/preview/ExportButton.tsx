"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, Check, Loader2 } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";

interface ExportButtonProps {
  onExport: () => void;
  disabled?: boolean;
}

export function ExportButton({ onExport, disabled = false }: ExportButtonProps) {
  const isExporting = useEditorStore((s) => s.isExporting);
  const exportProgress = useEditorStore((s) => s.exportProgress);
  const isComplete = exportProgress >= 100;

  return (
    <motion.button
      whileHover={!disabled && !isExporting ? { scale: 1.03 } : {}}
      whileTap={!disabled && !isExporting ? { scale: 0.97 } : {}}
      onClick={onExport}
      disabled={disabled || isExporting}
      className={`
        relative overflow-hidden
        flex items-center gap-2.5 px-6 py-3
        rounded-[var(--radius-button)] font-medium text-sm
        transition-all duration-300
        ${
          isComplete
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            : isExporting
              ? "bg-cyan/10 text-cyan border border-cyan/30"
              : "bg-gradient-to-r from-cyan/20 to-violet/20 text-text-primary border border-white/10 hover:border-cyan/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
        }
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      {/* Progress bar background */}
      {isExporting && !isComplete && (
        <motion.div
          className="absolute inset-0 bg-cyan/10"
          initial={{ width: "0%" }}
          animate={{ width: `${exportProgress}%` }}
          transition={{ duration: 0.3 }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2.5">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Check className="h-4 w-4" />
            </motion.span>
          ) : isExporting ? (
            <motion.span
              key="loading"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span key="download">
              <Download className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>

        <span>
          {isComplete
            ? "Download Ready"
            : isExporting
              ? `Rendering ${Math.round(exportProgress)}%`
              : "Export Video"}
        </span>
      </span>
    </motion.button>
  );
}
