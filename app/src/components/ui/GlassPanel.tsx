"use client";

import { motion } from "framer-motion";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
  animate?: boolean;
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function GlassPanel({
  children,
  className = "",
  hover = false,
  padding = "md",
  animate = true,
}: GlassPanelProps) {
  const Component = animate ? motion.div : "div";

  const baseClasses = `
    rounded-[var(--radius-panel)]
    bg-white/[0.03] backdrop-blur-xl
    border border-white/[0.06]
    ${paddingMap[padding]}
    ${hover ? "transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20" : ""}
    ${className}
  `;

  if (!animate) {
    return <div className={baseClasses}>{children}</div>;
  }

  return (
    <Component
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={baseClasses}
    >
      {children}
    </Component>
  );
}
