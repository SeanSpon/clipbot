"use client";

import { motion } from "framer-motion";
import { useProjectStore } from "@/stores/project-store";
import { Brain } from "lucide-react";

export function AIThinking() {
  const message = useProjectStore((s) => s.thinkingMessage);

  if (!message) return null;

  // Generate neural network nodes
  const nodes = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    cx: 20 + (i % 4) * 20,
    cy: 20 + Math.floor(i / 4) * 25,
    delay: i * 0.15,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-4 rounded-[var(--radius-card)] border border-violet/20 bg-violet/[0.04] p-4"
    >
      {/* Neural network visualization */}
      <div className="relative flex-shrink-0">
        <svg width="80" height="80" viewBox="0 0 100 100" className="opacity-70">
          {/* Connections */}
          {nodes.map((a) =>
            nodes
              .filter(
                (b) =>
                  b.id > a.id &&
                  Math.abs(a.cx - b.cx) <= 25 &&
                  Math.abs(a.cy - b.cy) <= 30,
              )
              .map((b) => (
                <motion.line
                  key={`${a.id}-${b.id}`}
                  x1={a.cx}
                  y1={a.cy}
                  x2={b.cx}
                  y2={b.cy}
                  stroke="#8b5cf6"
                  strokeWidth="0.5"
                  animate={{ opacity: [0.1, 0.4, 0.1] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: a.delay,
                  }}
                />
              )),
          )}

          {/* Nodes */}
          {nodes.map((node) => (
            <motion.circle
              key={node.id}
              cx={node.cx}
              cy={node.cy}
              r="3"
              fill="#8b5cf6"
              animate={{
                r: [2.5, 4, 2.5],
                opacity: [0.3, 0.9, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: node.delay,
              }}
            />
          ))}
        </svg>

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="h-6 w-6 text-violet-glow" />
        </motion.div>
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-xs font-medium uppercase tracking-wider text-violet-glow/70 mb-1">
          AI Director
        </p>
        <motion.p
          key={message}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-text-secondary leading-relaxed"
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  );
}
