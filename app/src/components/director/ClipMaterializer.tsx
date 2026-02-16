"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/stores/project-store";
import { ClipCard } from "./ClipCard";
import { updateClip } from "@/lib/api";

interface ClipMaterializerProps {
  onSelectClip?: (clipId: string) => void;
}

export function ClipMaterializer({ onSelectClip }: ClipMaterializerProps) {
  const clips = useProjectStore((s) => s.clips);
  const project = useProjectStore((s) => s.project);
  const setClips = useProjectStore((s) => s.setClips);

  const handleApprove = async (clipId: string) => {
    if (!project) return;
    const newStatus = clips.find((c) => c.id === clipId)?.status === "approved" ? "pending" : "approved";
    try {
      await updateClip(project.id, clipId, { status: newStatus });
      setClips(
        clips.map((c) => (c.id === clipId ? { ...c, status: newStatus } : c)),
      );
    } catch {
      // Optimistically update anyway for offline/demo
      setClips(
        clips.map((c) => (c.id === clipId ? { ...c, status: newStatus } : c)),
      );
    }
  };

  const handleReject = async (clipId: string) => {
    if (!project) return;
    const newStatus = clips.find((c) => c.id === clipId)?.status === "rejected" ? "pending" : "rejected";
    try {
      await updateClip(project.id, clipId, { status: newStatus });
      setClips(
        clips.map((c) => (c.id === clipId ? { ...c, status: newStatus } : c)),
      );
    } catch {
      setClips(
        clips.map((c) => (c.id === clipId ? { ...c, status: newStatus } : c)),
      );
    }
  };

  if (clips.length === 0) return null;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <h3 className="font-display text-lg font-semibold text-text-primary">
          Discovered Clips
        </h3>
        <span className="text-sm text-text-secondary">
          {clips.length} clip{clips.length !== 1 ? "s" : ""}
        </span>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {clips.map((clip, i) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              index={i}
              onSelect={onSelectClip}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
