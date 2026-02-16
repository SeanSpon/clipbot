"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Clapperboard, RotateCcw } from "lucide-react";
import { Background } from "@/components/shared/Background";
import { PageTransition } from "@/components/shared/PageTransition";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import { CinematicLoader } from "@/components/ui/CinematicLoader";
import { TranscriptFlow } from "@/components/director/TranscriptFlow";
import { AIThinking } from "@/components/director/AIThinking";
import { ClipMaterializer } from "@/components/director/ClipMaterializer";
import { useProjectStore } from "@/stores/project-store";
import { getProject, getClips } from "@/lib/api";

export default function DirectorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const project = useProjectStore((s) => s.project);
  const clips = useProjectStore((s) => s.clips);
  const progress = useProjectStore((s) => s.progress);
  const setProject = useProjectStore((s) => s.setProject);
  const setClips = useProjectStore((s) => s.setClips);
  const connectEvents = useProjectStore((s) => s.connectEvents);
  const disconnectEvents = useProjectStore((s) => s.disconnectEvents);

  useEffect(() => {
    if (!projectId) return;

    // Fetch project data
    getProject(projectId)
      .then(setProject)
      .catch(console.error);

    getClips(projectId)
      .then(setClips)
      .catch(() => {});

    // Connect to SSE for real-time updates
    connectEvents(projectId);

    return () => {
      disconnectEvents();
    };
  }, [projectId, setProject, setClips, connectEvents, disconnectEvents]);

  const isProcessing =
    project?.status === "transcribing" || project?.status === "directing";
  const isComplete = project?.status === "directed" || project?.status === "complete";

  const approvedClips = clips.filter((c) => c.status !== "rejected");

  const handlePreview = () => {
    if (approvedClips.length > 0) {
      router.push(`/projects/${projectId}/preview`);
    }
  };

  return (
    <main className="relative min-h-screen px-6 py-12">
      <Background particleCount={30} />

      <PageTransition className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
              <Clapperboard className="h-3.5 w-3.5 text-violet" />
              Director&apos;s Cut
            </div>
            <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
              {project?.name || "Loading..."}
            </h1>
          </div>

          {isComplete && approvedClips.length > 0 && (
            <GlowButton
              variant="cyan"
              icon={<ArrowRight className="h-4 w-4" />}
              onClick={handlePreview}
            >
              Preview & Export
            </GlowButton>
          )}
        </div>

        {/* Progress bar (during processing) */}
        {isProcessing && (
          <GlassPanel>
            <CinematicLoader
              progress={progress.percent}
              stage={progress.stage || "Analyzing footage..."}
            />
          </GlassPanel>
        )}

        {/* Two-column layout for transcript + AI thinking */}
        {(isProcessing || isComplete) && (
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassPanel animate={false} className="space-y-4">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Transcript
              </h2>
              <TranscriptFlow />
            </GlassPanel>

            <div className="space-y-4">
              <AIThinking />

              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-[var(--radius-card)] border border-cyan/20 bg-cyan/[0.04] p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan/10">
                    <Clapperboard className="h-4 w-4 text-cyan" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cyan">
                      Analysis Complete
                    </p>
                    <p className="text-xs text-text-secondary">
                      Found {clips.length} potential clips. Review and approve below.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Clips grid */}
        <ClipMaterializer
          onSelectClip={(clipId) => {
            router.push(`/projects/${projectId}/preview?clip=${clipId}`);
          }}
        />

        {/* Re-run option */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center pt-4"
          >
            <button
              className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
              onClick={() => {
                // Could trigger re-analysis here
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-run AI Director with different settings
            </button>
          </motion.div>
        )}
      </PageTransition>
    </main>
  );
}
