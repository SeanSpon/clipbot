"use client";

import { ParticleField } from "@/components/ui/ParticleField";

interface BackgroundProps {
  particleCount?: number;
}

export function Background({ particleCount = 50 }: BackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-void" />

      {/* Radial accent glow - top */}
      <div
        className="absolute -top-1/4 left-1/2 h-[600px] w-[800px] -translate-x-1/2 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(6, 182, 212, 0.15) 0%, transparent 70%)",
        }}
      />

      {/* Radial accent glow - bottom right */}
      <div
        className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] opacity-15"
        style={{
          background:
            "radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
        }}
      />

      {/* Subtle noise grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Particle canvas */}
      <ParticleField particleCount={particleCount} />
    </div>
  );
}
