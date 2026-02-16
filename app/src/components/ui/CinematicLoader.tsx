"use client";

import { motion } from "framer-motion";

interface CinematicLoaderProps {
  progress: number;
  stage?: string;
  className?: string;
}

export function CinematicLoader({
  progress,
  stage,
  className = "",
}: CinematicLoaderProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {stage && (
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-sm font-medium text-text-secondary"
        >
          {stage}
        </motion.p>
      )}

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {/* Background glow */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #06b6d4, #8b5cf6, #06b6d4)",
            backgroundSize: "200% 100%",
          }}
          animate={{
            width: `${clampedProgress}%`,
            backgroundPosition: ["0% 0%", "200% 0%"],
          }}
          transition={{
            width: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
            backgroundPosition: {
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        />

        {/* Leading glow orb */}
        <motion.div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)",
            filter: "blur(4px)",
          }}
          animate={{
            left: `${clampedProgress}%`,
            opacity: clampedProgress > 0 ? [0.6, 1, 0.6] : 0,
          }}
          transition={{
            left: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
            opacity: { duration: 1.5, repeat: Infinity },
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
        <span>{stage || "Processing..."}</span>
        <motion.span
          key={clampedProgress}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
        >
          {Math.round(clampedProgress)}%
        </motion.span>
      </div>
    </div>
  );
}
