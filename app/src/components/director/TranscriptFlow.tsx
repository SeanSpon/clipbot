"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/stores/project-store";

export function TranscriptFlow() {
  const transcript = useProjectStore((s) => s.transcript);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div
      ref={containerRef}
      className="relative h-64 overflow-y-auto overflow-x-hidden rounded-[var(--radius-panel)] bg-white/[0.02] p-6 scrollbar-thin"
    >
      {transcript.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-text-muted italic"
        >
          Waiting for transcript...
        </motion.p>
      )}

      <div className="flex flex-wrap gap-x-1.5 gap-y-1">
        <AnimatePresence>
          {transcript.map((w, i) => (
            <motion.span
              key={`${i}-${w.word}`}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="inline-block text-sm text-text-primary"
            >
              {w.word}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Blinking cursor */}
        {transcript.length > 0 && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block h-4 w-0.5 translate-y-0.5 bg-cyan"
          />
        )}
      </div>
    </div>
  );
}
