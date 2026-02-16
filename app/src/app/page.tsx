"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clapperboard } from "lucide-react";
import { Background } from "@/components/shared/Background";
import { PageTransition } from "@/components/shared/PageTransition";
import { PortalDropZone } from "@/components/upload/PortalDropZone";
import { CameraSetup } from "@/components/upload/CameraSetup";
import { createProject, uploadFile, triggerDirector } from "@/lib/api";

type Stage = "drop" | "label" | "processing";

export default function UploadPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("drop");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = useCallback((selected: File[]) => {
    setFiles(selected);
    setStage("label");
  }, []);

  const handleLabelComplete = useCallback(
    async (labeled: { file: File; label: string }[]) => {
      setIsUploading(true);

      try {
        // Create a project
        const project = await createProject(
          labeled[0]?.file.name.replace(/\.[^.]+$/, "") || "Untitled Project",
        );

        // Upload all files in parallel
        await Promise.all(
          labeled.map(({ file, label }) =>
            uploadFile(project.id, file, label, (percent) => {
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: percent,
              }));
            }),
          ),
        );

        // Trigger the AI Director
        await triggerDirector(project.id);

        // Navigate to Director's Cut screen
        router.push(`/projects/${project.id}`);
      } catch (err) {
        console.error("Upload failed:", err);
        setIsUploading(false);
      }
    },
    [router],
  );

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <Background particleCount={40} />

      <PageTransition className="w-full max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-text-secondary">
            <Clapperboard className="h-3.5 w-3.5 text-cyan" />
            AI Video Director
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            <span className="bg-gradient-to-r from-cyan via-violet to-cyan bg-clip-text text-transparent">
              ClipBot
            </span>
          </h1>

          <p className="mt-3 text-base text-text-secondary max-w-md mx-auto">
            Upload multi-camera footage. Let the AI direct, cut, and polish
            your video.
          </p>
        </motion.div>

        {/* Content stages */}
        <AnimatePresence mode="wait">
          {stage === "drop" && (
            <motion.div
              key="drop"
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PortalDropZone onFilesSelected={handleFilesSelected} />
            </motion.div>
          )}

          {stage === "label" && (
            <motion.div
              key="label"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
            >
              <CameraSetup
                files={files}
                onComplete={handleLabelComplete}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </PageTransition>
    </main>
  );
}
