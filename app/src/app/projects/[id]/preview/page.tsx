"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Background } from "@/components/shared/Background";
import { PageTransition } from "@/components/shared/PageTransition";
import { Theater } from "@/components/preview/Theater";
import { StylePicker } from "@/components/preview/StylePicker";
import { EffectControls } from "@/components/preview/EffectControls";
import { ExportButton } from "@/components/preview/ExportButton";
import { GlowButton } from "@/components/ui/GlowButton";
import { useProjectStore } from "@/stores/project-store";
import { useEditorStore } from "@/stores/editor-store";
import { getProject, getClips, triggerRender } from "@/lib/api";

export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.id;

  const project = useProjectStore((s) => s.project);
  const clips = useProjectStore((s) => s.clips);
  const setProject = useProjectStore((s) => s.setProject);
  const setClips = useProjectStore((s) => s.setClips);

  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectClip = useEditorStore((s) => s.selectClip);
  const selectedPreset = useEditorStore((s) => s.selectedPreset);
  const setExporting = useEditorStore((s) => s.setExporting);
  const setExportProgress = useEditorStore((s) => s.setExportProgress);
  const isExporting = useEditorStore((s) => s.isExporting);

  // Load project + clips
  useEffect(() => {
    if (!projectId) return;

    if (!project) {
      getProject(projectId).then(setProject).catch(console.error);
    }

    if (clips.length === 0) {
      getClips(projectId).then(setClips).catch(() => {});
    }
  }, [projectId, project, clips.length, setProject, setClips]);

  // Select initial clip from URL param
  useEffect(() => {
    const clipParam = searchParams.get("clip");
    if (clipParam && !selectedClipId) {
      selectClip(clipParam);
    }
  }, [searchParams, selectedClipId, selectClip]);

  const approvedClips = useMemo(
    () => clips.filter((c) => c.status !== "rejected"),
    [clips],
  );

  const currentIndex = useMemo(
    () => approvedClips.findIndex((c) => c.id === selectedClipId),
    [approvedClips, selectedClipId],
  );

  const currentClip = currentIndex >= 0 ? approvedClips[currentIndex] : null;

  const goToClip = useCallback(
    (direction: -1 | 1) => {
      if (approvedClips.length === 0) return;
      const nextIndex =
        (currentIndex + direction + approvedClips.length) %
        approvedClips.length;
      selectClip(approvedClips[nextIndex].id);
    },
    [approvedClips, currentIndex, selectClip],
  );

  const handleExport = async () => {
    if (!projectId || isExporting) return;
    const clipIds = approvedClips.map((c) => c.id);
    if (clipIds.length === 0) return;

    setExporting(true);
    setExportProgress(0);

    try {
      await triggerRender(projectId, clipIds, selectedPreset);

      // Simulate progress for now (real progress would come via SSE)
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 15;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
        }
        setExportProgress(p);
      }, 800);
    } catch (err) {
      console.error("Export failed:", err);
      setExporting(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      <Background particleCount={20} />

      <PageTransition className="flex min-h-screen flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <GlowButton
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            Back to Clips
          </GlowButton>

          <div className="flex items-center gap-3">
            {currentClip && (
              <motion.div
                key={currentClip.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-sm font-display font-semibold text-text-primary">
                  {currentClip.title}
                </p>
                <p className="text-xs text-text-muted">
                  Clip {currentIndex + 1} of {approvedClips.length}
                </p>
              </motion.div>
            )}
          </div>

          <ExportButton onExport={handleExport} disabled={approvedClips.length === 0} />
        </div>

        {/* Theater */}
        <div className="flex flex-1 items-center justify-center px-6 pb-6">
          <div className="relative w-full max-w-5xl">
            {/* Navigation arrows */}
            {approvedClips.length > 1 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1, x: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => goToClip(-1)}
                  className="absolute -left-14 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-text-muted hover:bg-white/[0.1] hover:text-text-primary transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, x: 2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => goToClip(1)}
                  className="absolute -right-14 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-text-muted hover:bg-white/[0.1] hover:text-text-primary transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
              </>
            )}

            <Theater videoUrl={currentClip?.videoUrl} />
          </div>
        </div>

        {/* Bottom controls bar */}
        <div className="relative px-6 pb-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="relative">
              <StylePicker />
            </div>

            {/* Clip pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {approvedClips.map((clip, i) => (
                <motion.button
                  key={clip.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectClip(clip.id)}
                  className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs transition-all duration-200
                    ${
                      clip.id === selectedClipId
                        ? "bg-cyan/20 text-cyan border border-cyan/30"
                        : "bg-white/[0.04] text-text-muted hover:bg-white/[0.08] hover:text-text-secondary border border-transparent"
                    }
                  `}
                >
                  {i + 1}
                </motion.button>
              ))}
            </div>

            <div className="relative">
              <EffectControls />
            </div>
          </div>
        </div>
      </PageTransition>
    </main>
  );
}
