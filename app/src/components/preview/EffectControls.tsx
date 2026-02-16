"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sliders, X, Volume2, Sun, Contrast, Droplets } from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "@/stores/editor-store";

interface Slider {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export function EffectControls() {
  const showEffectPanel = useEditorStore((s) => s.showEffectPanel);
  const toggleEffectPanel = useEditorStore((s) => s.toggleEffectPanel);

  const [effects, setEffects] = useState<Record<string, number>>({
    volume: 80,
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });

  const sliders: Slider[] = [
    {
      id: "volume",
      label: "Volume",
      icon: <Volume2 className="h-4 w-4" />,
      value: effects.volume,
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
    },
    {
      id: "brightness",
      label: "Brightness",
      icon: <Sun className="h-4 w-4" />,
      value: effects.brightness,
      min: 0,
      max: 200,
      step: 1,
      unit: "%",
    },
    {
      id: "contrast",
      label: "Contrast",
      icon: <Contrast className="h-4 w-4" />,
      value: effects.contrast,
      min: 0,
      max: 200,
      step: 1,
      unit: "%",
    },
    {
      id: "saturation",
      label: "Saturation",
      icon: <Droplets className="h-4 w-4" />,
      value: effects.saturation,
      min: 0,
      max: 200,
      step: 1,
      unit: "%",
    },
  ];

  const updateEffect = (id: string, value: number) => {
    setEffects((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleEffectPanel}
        className="flex items-center gap-2 rounded-[var(--radius-button)] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-text-secondary transition-all hover:border-cyan/30 hover:bg-cyan/[0.05] hover:text-cyan"
      >
        <Sliders className="h-4 w-4" />
        Effects
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {showEffectPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-full right-0 mb-3 w-72 rounded-[var(--radius-panel)] border border-white/[0.08] bg-void-light/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/40"
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-display text-sm font-semibold text-text-primary">
                Effects
              </h4>
              <button
                onClick={toggleEffectPanel}
                className="rounded-full p-1 text-text-muted hover:bg-white/10 hover:text-text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {sliders.map((slider) => (
                <div key={slider.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      {slider.icon}
                      {slider.label}
                    </div>
                    <span className="text-xs tabular-nums text-text-muted">
                      {slider.value}{slider.unit}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={slider.value}
                    onChange={(e) =>
                      updateEffect(slider.id, Number(e.target.value))
                    }
                    className="w-full accent-cyan h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(6,182,212,0.4)]
                      [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:hover:shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                  />
                </div>
              ))}
            </div>

            {/* Reset */}
            <button
              onClick={() =>
                setEffects({
                  volume: 80,
                  brightness: 100,
                  contrast: 100,
                  saturation: 100,
                })
              }
              className="mt-4 w-full rounded-[var(--radius-button)] border border-white/[0.06] bg-white/[0.02] py-2 text-xs text-text-muted hover:text-text-secondary hover:bg-white/[0.04] transition-all"
            >
              Reset to defaults
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
