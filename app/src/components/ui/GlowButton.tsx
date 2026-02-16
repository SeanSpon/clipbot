"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type Variant = "cyan" | "violet" | "ghost";

interface GlowButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const colorMap: Record<Variant, { bg: string; glow: string; text: string }> = {
  cyan: {
    bg: "bg-cyan/10 hover:bg-cyan/20 border-cyan/30 hover:border-cyan/50",
    glow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]",
    text: "text-cyan-glow",
  },
  violet: {
    bg: "bg-violet/10 hover:bg-violet/20 border-violet/30 hover:border-violet/50",
    glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]",
    text: "text-violet-glow",
  },
  ghost: {
    bg: "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20",
    glow: "",
    text: "text-text-primary",
  },
};

const sizeMap = {
  sm: "px-4 py-2 text-sm rounded-[0.625rem]",
  md: "px-6 py-3 text-base rounded-[0.75rem]",
  lg: "px-8 py-4 text-lg rounded-[1rem]",
};

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      variant = "cyan",
      size = "md",
      loading = false,
      icon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const colors = colorMap[variant];

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`
          relative inline-flex items-center justify-center gap-2
          border font-medium transition-all duration-300
          ${colors.bg} ${colors.glow} ${colors.text} ${sizeMap[size]}
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <motion.span
            className="absolute inset-0 rounded-[inherit] border border-current opacity-50"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {icon && <span className="flex-shrink-0">{icon}</span>}

        <span className={loading ? "opacity-60" : ""}>{children}</span>

        {loading && (
          <motion.span
            className="ml-1 h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        )}
      </motion.button>
    );
  },
);

GlowButton.displayName = "GlowButton";
