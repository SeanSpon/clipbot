"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Key, Save, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Background } from "@/components/shared/Background";
import { PageTransition } from "@/components/shared/PageTransition";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";

interface ApiKeyField {
  id: string;
  label: string;
  envVar: string;
  placeholder: string;
}

const API_KEYS: ApiKeyField[] = [
  {
    id: "openai",
    label: "OpenAI API Key",
    envVar: "OPENAI_API_KEY",
    placeholder: "sk-...",
  },
  {
    id: "anthropic",
    label: "Anthropic API Key",
    envVar: "ANTHROPIC_API_KEY",
    placeholder: "sk-ant-...",
  },
  {
    id: "assemblyai",
    label: "AssemblyAI API Key",
    envVar: "ASSEMBLYAI_API_KEY",
    placeholder: "Your AssemblyAI key",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const updateKey = (id: string, value: string) => {
    setKeys((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  };

  const toggleVisibility = (id: string) => {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    // In production, these would be saved to the backend or .env
    // For now, store in localStorage as a demo
    Object.entries(keys).forEach(([id, value]) => {
      if (value) {
        localStorage.setItem(`clipbot_api_key_${id}`, value);
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="relative min-h-screen px-6 py-12">
      <Background particleCount={20} />

      <PageTransition className="mx-auto max-w-xl space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/")}
            className="mb-4 flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <h1 className="font-display text-2xl font-bold text-text-primary">
            Settings
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure your API keys for AI services.
          </p>
        </div>

        {/* API Keys */}
        <GlassPanel className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Key className="h-4 w-4 text-violet" />
            API Keys
          </div>

          <div className="space-y-4">
            {API_KEYS.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-1.5"
              >
                <label
                  htmlFor={field.id}
                  className="block text-xs font-medium text-text-secondary"
                >
                  {field.label}
                  <span className="ml-2 text-text-muted">({field.envVar})</span>
                </label>
                <div className="relative">
                  <input
                    id={field.id}
                    type={visible[field.id] ? "text" : "password"}
                    placeholder={field.placeholder}
                    value={keys[field.id] || ""}
                    onChange={(e) => updateKey(field.id, e.target.value)}
                    className="w-full rounded-[var(--radius-button)] border border-white/10 bg-white/[0.03] py-2.5 pl-4 pr-10 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-violet/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-violet/20"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility(field.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {visible[field.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <GlowButton
              variant="violet"
              icon={<Save className="h-4 w-4" />}
              onClick={handleSave}
            >
              {saved ? "Saved!" : "Save Keys"}
            </GlowButton>
          </div>
        </GlassPanel>
      </PageTransition>
    </main>
  );
}
