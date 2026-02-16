"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Film, Check } from "lucide-react";

interface PortalDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function PortalDropZone({ onFilesSelected, disabled = false }: PortalDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [absorbed, setAbsorbed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      dragCounter.current++;
      setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;
      const files = Array.from(fileList).filter((f) =>
        f.type.startsWith("video/"),
      );
      if (files.length === 0) return;

      setAbsorbed(true);
      setTimeout(() => {
        onFilesSelected(files);
        setAbsorbed(false);
        setIsDragging(false);
        dragCounter.current = 0;
      }, 800);
    },
    [onFilesSelected, disabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative mx-auto w-full max-w-2xl"
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        animate={
          absorbed
            ? { scale: 0.95, opacity: 0.8 }
            : isDragging
              ? { scale: 1.02 }
              : { scale: 1 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          group relative cursor-pointer overflow-hidden
          rounded-[1.5rem] border-2 border-dashed
          p-16 text-center
          transition-colors duration-300
          ${
            isDragging
              ? "border-cyan bg-cyan/[0.05]"
              : "border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]"
          }
          ${disabled ? "pointer-events-none opacity-50" : ""}
        `}
      >
        {/* Pulse ring on drag */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute inset-0 rounded-[1.5rem]"
            >
              <motion.div
                className="absolute inset-0 rounded-[1.5rem] border-2 border-cyan/30"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-[1.5rem] border border-violet/20"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Absorbed effect */}
        <AnimatePresence>
          {absorbed && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: [0.3, 0] }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 m-auto h-32 w-32 rounded-full bg-cyan/20"
            />
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div
            animate={
              absorbed
                ? { scale: 0.5, opacity: 0 }
                : isDragging
                  ? { y: -8, scale: 1.1 }
                  : { y: 0, scale: 1 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <AnimatePresence mode="wait">
              {absorbed ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan/10"
                >
                  <Check className="h-10 w-10 text-cyan" />
                </motion.div>
              ) : isDragging ? (
                <motion.div
                  key="dragging"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan/10"
                >
                  <Film className="h-10 w-10 text-cyan-glow" />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.04] group-hover:bg-cyan/10 transition-colors duration-300"
                >
                  <Upload className="h-10 w-10 text-text-secondary group-hover:text-cyan transition-colors duration-300" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence mode="wait">
            {absorbed ? (
              <motion.p
                key="absorbed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-display font-semibold text-cyan"
              >
                Files absorbed
              </motion.p>
            ) : isDragging ? (
              <motion.div
                key="drag-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <p className="text-lg font-display font-semibold text-cyan-glow glow-text-cyan">
                  Release to upload
                </p>
              </motion.div>
            ) : (
              <motion.div key="idle-text" className="space-y-2">
                <p className="text-lg font-display font-semibold text-text-primary">
                  Drop your footage here
                </p>
                <p className="text-sm text-text-secondary">
                  Drag & drop video files, or{" "}
                  <span className="text-cyan underline decoration-cyan/30 underline-offset-2">
                    browse
                  </span>
                </p>
                <p className="text-xs text-text-muted">
                  MP4, MOV, WebM - Multi-camera supported
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
