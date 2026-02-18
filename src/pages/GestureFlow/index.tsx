import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Music2,
  Clock,
  Plus,
  X,
  Menu,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Volume2,
  VolumeX,
  ScanSearch,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useCloudImages } from "@/hooks/useCloudImages";
import { CloudPanel } from "@/components/CloudPanel/CloudPanel";
import { ImageDisplay } from "@/components/CloudPanel/ImageDisplay";
import { Playlist } from "@/components/Playlist";
import { Button as UiButton } from "@/components/ui/button";

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// --- Data Models ---
type Interval = {
  id: string;
  duration: number; // seconds
  type: "pose" | "break";
};

type Preset = {
  name: string;
  intervals: number[]; // seconds
};

type DetailFocus = {
  label: string;
  scale: number;
  translateX: number;
  translateY: number;
};
type DetailRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const PRESETS: Preset[] = [
  { name: "Gesture Warmup", intervals: [30, 30, 30, 30, 30, 60, 60, 60] },
  { name: "Figure Study", intervals: [120, 120, 300, 300, 600] },
  { name: "Long Poses", intervals: [600, 1200, 1200] },
];

const FULL_FOCUS: DetailFocus = { label: "Full", scale: 1, translateX: 0, translateY: 0 };
const LONG_POSE_DETAIL_MIN_SECONDS = 5 * 60;
const LONG_POSE_DETAIL_HOLD_SECONDS = 2 * 60;
const DEFAULT_DETAIL_RECT: DetailRect = { x: 0.32, y: 0.2, w: 0.36, h: 0.46 };

// --- Components ---

const Button = ({ className, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) => {
  const variants = {
    primary: "bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-sm",
    secondary: "bg-stone-200 text-stone-900 hover:bg-stone-300",
    ghost: "bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

type GestureFlowPageProps = {
  onSwitchToClassic?: () => void;
  classicTheme?: "light" | "dark";
  onChangeClassicTheme?: (theme: "light" | "dark") => void;
};

export const GestureFlowPage: React.FC<GestureFlowPageProps> = ({
  onSwitchToClassic,
  classicTheme = "light",
  onChangeClassicTheme,
}) => {
  const isDark = classicTheme === "dark";
  // State
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSilentMode, setIsSilentMode] = useState(true);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [detailEditorOpen, setDetailEditorOpen] = useState(false);
  const [detailRectsByImage, setDetailRectsByImage] = useState<Record<string, DetailRect[]>>({});
  const [selectedDetailIndexByImage, setSelectedDetailIndexByImage] = useState<Record<string, number>>({});
  const [detailEditorImageIndex, setDetailEditorImageIndex] = useState(0);
  const [inputStr, setInputStr] = useState("30, 60, 300");
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [poseDrawerOpen, setPoseDrawerOpen] = useState(false);
  const [showDrawControls, setShowDrawControls] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(360);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [resizingPanel, setResizingPanel] = useState<"left" | "right" | null>(null);

  // Mobile/tablet UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const prevIdxRef = useRef(0);
  const drawControlsTimeoutRef = useRef<number | null>(null);
  const [editAction, setEditAction] = useState<"move" | "resize" | null>(null);
  const editStartRef = useRef<{ x: number; y: number } | null>(null);
  const startRectRef = useRef<{ rect: DetailRect; index: number; imageKey: string } | null>(null);
  const resizeStartRef = useRef<{ x: number; leftWidth: number; rightWidth: number } | null>(null);

  // Cloud images
  const cloud = useCloudImages();

  const ThemeControls = () => (
    <div className="flex items-center gap-2">
      <UiButton
        variant={classicTheme === "light" ? "default" : "ghost"}
        size="icon-sm"
        onClick={() => onChangeClassicTheme?.("light")}
        className={cn(
          "rounded-full",
          classicTheme === "light" ? "bg-stone-900 text-white hover:bg-stone-800" : "text-stone-600"
        )}
        title="Light mode"
      >
        <Sun size={14} />
      </UiButton>
      <UiButton
        variant={classicTheme === "dark" ? "default" : "ghost"}
        size="icon-sm"
        onClick={() => onChangeClassicTheme?.("dark")}
        className={cn(
          "rounded-full",
          classicTheme === "dark" ? "bg-stone-900 text-white hover:bg-stone-800" : "text-stone-600"
        )}
        title="Dark mode"
      >
        <Moon size={14} />
      </UiButton>
    </div>
  );

  const speakText = (text: string, rate?: number) => {
    if (isSilentMode || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (rate) utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const loadPreset = (preset: Preset) => {
    setIsActive(false);
    const newIntervals = preset.intervals.map((dur) => ({
      id: Math.random().toString(36).substr(2, 9),
      duration: dur,
      type: "pose" as const
    }));
    setIntervals(newIntervals);
    setCurrentIdx(0);
    setTimeLeft(newIntervals[0].duration);
  };

  // Initialize with default preset
  useEffect(() => {
    if (intervals.length === 0) {
      loadPreset(PRESETS[0]);
    }
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;

          // Voice notifications
          if (isActive) {
             if (newTime === 30) {
               speakText("30 seconds remaining");
             } else if (newTime === 10) {
               speakText("Prepare to change pose");
             }
          }

          return newTime;
        });

      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Next interval
      if (currentIdx < intervals.length - 1) {
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        setTimeLeft(intervals[nextIdx].duration);

        speakText("Change pose", 1.1);
      } else {
        setIsActive(false);
        speakText("Session complete");
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, currentIdx, intervals, isSilentMode]);

  // Advance cloud image when pose changes
  useEffect(() => {
    if (currentIdx !== prevIdxRef.current && cloud.images.length > 0) {
      const prev = prevIdxRef.current;
      if (currentIdx === prev + 1) {
        cloud.nextImage();
      } else {
        cloud.goToImage(currentIdx % cloud.images.length);
      }
    }
    prevIdxRef.current = currentIdx;
  }, [currentIdx, cloud.images.length, cloud.nextImage, cloud.goToImage]);

  // Close sidebar on navigation (mobile)
  const closeMobilePanels = () => {
    setSidebarOpen(false);
    setMusicOpen(false);
  };

  const loadFromInput = () => {
    const values = inputStr.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (values.length > 0) {
      loadPreset({ name: "Custom", intervals: values });
    }
  };

  const toggleTimer = () => {
    setIsActive((prev) => {
      const next = !prev;
      if (next && cloud.images.length > 0) setIsDrawMode(true);
      return next;
    });
  };

  const resetTimer = () => {
    setIsActive(false);
    setCurrentIdx(0);
    if (intervals.length > 0) setTimeLeft(intervals[0].duration);
  };

  const skipForward = () => {
    if (currentIdx < intervals.length - 1) {
      setCurrentIdx(c => c + 1);
      setTimeLeft(intervals[currentIdx + 1].duration);
    }
  };

  const goToPose = (idx: number) => {
    if (idx < 0 || idx >= intervals.length) return;
    setCurrentIdx(idx);
    setTimeLeft(intervals[idx].duration);
    if (cloud.images.length > 0) {
      cloud.goToImage(idx % cloud.images.length);
    }
    prevIdxRef.current = idx;
    setPoseDrawerOpen(false);
  };

  const getImageKeyByIndex = (idx: number): string => cloud.images[idx]?.path ?? `image-${idx}`;
  const getDetailRectsForImage = (imageKey: string): DetailRect[] =>
    detailRectsByImage[imageKey] && detailRectsByImage[imageKey].length > 0
      ? detailRectsByImage[imageKey]
      : [DEFAULT_DETAIL_RECT];
  const getSelectedDetailIndexForImage = (imageKey: string, rectCount: number): number => {
    const raw = selectedDetailIndexByImage[imageKey] ?? 0;
    return Math.max(0, Math.min(raw, Math.max(0, rectCount - 1)));
  };

  const startPanelResize = (panel: "left" | "right", e: React.MouseEvent) => {
    e.preventDefault();
    setResizingPanel(panel);
    resizeStartRef.current = {
      x: e.clientX,
      leftWidth: leftPanelWidth,
      rightWidth: rightPanelWidth,
    };
  };

  const clampDetailRect = (r: DetailRect): DetailRect => {
    const minSize = 0.12;
    const w = Math.max(minSize, Math.min(0.9, r.w));
    const h = Math.max(minSize, Math.min(0.9, r.h));
    const x = Math.max(0, Math.min(1 - w, r.x));
    const y = Math.max(0, Math.min(1 - h, r.y));
    return { x, y, w, h };
  };

  const startDetailEdit = (e: React.MouseEvent, action: "move" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    setEditAction(action);
    editStartRef.current = { x: e.clientX, y: e.clientY };
    const imageKey = getImageKeyByIndex(detailEditorImageIndex);
    const rects = getDetailRectsForImage(imageKey);
    const selectedDetailIndex = getSelectedDetailIndexForImage(imageKey, rects.length);
    const rect = rects[selectedDetailIndex];
    if (!rect) return;
    startRectRef.current = { rect, index: selectedDetailIndex, imageKey };
  };

  useEffect(() => {
    if (!editAction) return;

    const onMove = (e: MouseEvent) => {
      if (!editStartRef.current || !startRectRef.current) return;
      const dx = (e.clientX - editStartRef.current.x) / window.innerWidth;
      const dy = (e.clientY - editStartRef.current.y) / window.innerHeight;
      const { rect: start, index, imageKey } = startRectRef.current;

      const next =
        editAction === "move"
          ? { ...start, x: start.x + dx, y: start.y + dy }
          : { ...start, w: start.w + dx, h: start.h + dy };

      setDetailRectsByImage((prev) => {
        const current = getDetailRectsForImage(imageKey);
        const updated = current.map((r, i) => (i === index ? clampDetailRect(next) : r));
        return { ...prev, [imageKey]: updated };
      });
    };

    const onUp = () => {
      setEditAction(null);
      editStartRef.current = null;
      startRectRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [editAction, detailRectsByImage, detailEditorImageIndex, selectedDetailIndexByImage]);

  useEffect(() => {
    if (!resizingPanel) return;

    const onMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const dx = e.clientX - resizeStartRef.current.x;
      const min = 240;
      const max = 560;

      if (resizingPanel === "left") {
        const next = Math.max(min, Math.min(max, resizeStartRef.current.leftWidth + dx));
        setLeftPanelWidth(next);
      } else {
        const next = Math.max(min, Math.min(max, resizeStartRef.current.rightWidth - dx));
        setRightPanelWidth(next);
      }
    };

    const onUp = () => {
      setResizingPanel(null);
      resizeStartRef.current = null;
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizingPanel]);

  const currentInterval = intervals[currentIdx];
  const nextInterval = intervals[currentIdx + 1];
  const totalTime = intervals.reduce((acc, curr) => acc + curr.duration, 0);

  // --- Shared sub-components for reuse across layouts ---

  const SetupSection = () => (
    <section>
      <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3 block">
        Quick Setup
      </label>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          placeholder="e.g. 30, 60, 120"
          className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-mono"
        />
        <Button onClick={loadFromInput} variant="secondary" className="px-3">
          <Plus size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2">
        {PRESETS.map(preset => (
          <button
            key={preset.name}
            onClick={() => { loadPreset(preset); closeMobilePanels(); }}
            className="text-left px-3 py-2 rounded-lg border border-stone-200 hover:border-stone-400 hover:bg-white transition-all text-sm font-medium text-stone-700"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </section>
  );

  const TimelineSection = ({ compact = false }: { compact?: boolean }) => (
    <section>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Session Timeline
        </label>
        <span className="text-xs text-stone-400">
          {intervals.length} poses &bull; {Math.floor(totalTime / 60)}m total
        </span>
      </div>

      <div className={cn("space-y-1 relative", compact && "max-h-48 overflow-y-auto")}>
        {/* Connector Line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-stone-200" />

        {intervals.map((interval, idx) => {
          const isCurrent = idx === currentIdx;
          const isPast = idx < currentIdx;

          return (
            <div
              key={interval.id}
              className={cn(
                "group relative flex items-center gap-3 p-2 rounded-lg transition-all",
                isCurrent ? "bg-white shadow-sm ring-1 ring-stone-200 z-10" : "hover:bg-stone-100/50",
                isPast && "opacity-50"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border z-10 transition-colors shrink-0",
                isCurrent ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 text-stone-500",
                isPast && "bg-stone-200 border-stone-200 text-stone-400"
              )}>
                {idx + 1}
              </div>
              <div className="flex-1 flex justify-between items-center">
                <span className={cn("text-sm font-medium", isCurrent ? "text-stone-900" : "text-stone-600")}>
                  {formatTime(interval.duration)} Pose
                </span>
                {isCurrent && (
                  <motion.div
                    layoutId="active-indicator"
                    className="w-1.5 h-1.5 rounded-full bg-green-500"
                  />
                )}
              </div>
              <button
                onClick={() => {
                  const newIntervals = [...intervals];
                  newIntervals.splice(idx, 1);
                  setIntervals(newIntervals);
                  if (isCurrent && idx > 0) setCurrentIdx(idx - 1);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-200 rounded text-stone-500 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );

  const TimerControls = () => (
    <div className="flex items-center justify-center gap-6 mt-8 lg:mt-12">
      <button
        onClick={() => setIsSilentMode((prev) => !prev)}
        className="p-4 rounded-full text-stone-500 hover:bg-stone-200 transition-colors"
        title={isSilentMode ? "Silent mode on" : "Silent mode off"}
      >
        {isSilentMode ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      <button
        onClick={resetTimer}
        className="p-4 rounded-full text-stone-500 hover:bg-stone-200 transition-colors"
        title="Reset Timer"
      >
        <RotateCcw size={24} />
      </button>

      <button
        onClick={toggleTimer}
        className="w-20 h-20 bg-stone-900 text-stone-50 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl hover:bg-stone-800"
      >
        {isActive ? <Pause size={32} fill="currentColor" strokeWidth={0} /> : <Play size={32} fill="currentColor" strokeWidth={0} className="ml-1" />}
      </button>

      <button
        onClick={skipForward}
        className="p-4 rounded-full text-stone-500 hover:bg-stone-200 transition-colors"
        title="Skip Pose"
      >
        <SkipForward size={24} strokeLinejoin="miter" strokeLinecap="square" />
      </button>
    </div>
  );

  const drawModeReady = isDrawMode && Boolean(cloud.currentImageUrl);
  const currentPoseDuration = currentInterval?.duration || 1;
  const autoShowCountdown =
    currentPoseDuration <= 30 ? timeLeft <= 10 : timeLeft <= 30;
  const showLeftHud = showDrawControls || autoShowCountdown;
  const elapsedInPose = Math.max(0, currentPoseDuration - timeLeft);
  const activeImageKey = getImageKeyByIndex(cloud.currentIndex);
  const activeImageDetailRects = getDetailRectsForImage(activeImageKey);
  const longPoseDetailStartsAt = Math.max(0, currentPoseDuration - LONG_POSE_DETAIL_HOLD_SECONDS);
  const useLongPoseDetail = isDetailMode && currentPoseDuration >= LONG_POSE_DETAIL_MIN_SECONDS;
  const shortPoseDetailStartsAt = Math.max(4, Math.floor(currentPoseDuration * 0.6));
  const detailCount = Math.max(1, activeImageDetailRects.length);
  const getDetailFocusByIndex = (idx: number): DetailFocus => {
    const rect =
      activeImageDetailRects[Math.max(0, Math.min(idx, detailCount - 1))] ?? activeImageDetailRects[0] ?? DEFAULT_DETAIL_RECT;
    return {
      label: `Detail ${Math.max(1, Math.min(idx + 1, detailCount))}/${detailCount}`,
      scale: Math.min(4, Math.max(1.25, 1 / Math.max(rect.w, rect.h))),
      translateX: (0.5 - (rect.x + rect.w / 2)) * 100,
      translateY: (0.5 - (rect.y + rect.h / 2)) * 100,
    };
  };
  const detailIndexFromProgress = (progress: number) =>
    Math.min(detailCount - 1, Math.max(0, Math.floor(progress * detailCount)));
  const longPoseProgress =
    currentPoseDuration > longPoseDetailStartsAt
      ? (elapsedInPose - longPoseDetailStartsAt) / Math.max(1, currentPoseDuration - longPoseDetailStartsAt)
      : 0;
  const shortPoseProgress =
    currentPoseDuration > shortPoseDetailStartsAt
      ? (elapsedInPose - shortPoseDetailStartsAt) / Math.max(1, currentPoseDuration - shortPoseDetailStartsAt)
      : 0;
  const currentFocus = !isDetailMode
    ? FULL_FOCUS
    : useLongPoseDetail
      ? elapsedInPose < longPoseDetailStartsAt
        ? FULL_FOCUS
        : getDetailFocusByIndex(detailIndexFromProgress(longPoseProgress))
      : elapsedInPose < shortPoseDetailStartsAt
        ? FULL_FOCUS
        : getDetailFocusByIndex(detailIndexFromProgress(shortPoseProgress));

  const revealDrawControls = () => {
    setShowDrawControls(true);
    if (drawControlsTimeoutRef.current) {
      window.clearTimeout(drawControlsTimeoutRef.current);
    }
    drawControlsTimeoutRef.current = window.setTimeout(() => setShowDrawControls(false), 650);
  };

  const hideDrawControls = () => {
    if (drawControlsTimeoutRef.current) {
      window.clearTimeout(drawControlsTimeoutRef.current);
      drawControlsTimeoutRef.current = null;
    }
    setShowDrawControls(false);
  };

  useEffect(() => {
    return () => {
      if (drawControlsTimeoutRef.current) {
        window.clearTimeout(drawControlsTimeoutRef.current);
      }
    };
  }, []);

  if (drawModeReady) {
    return (
      <div
        className="relative h-screen w-full bg-black text-white overflow-hidden"
        onMouseMove={revealDrawControls}
        onMouseLeave={hideDrawControls}
      >
        <ImageDisplay
          src={cloud.currentImageUrl}
          imageName={cloud.images[cloud.currentIndex]?.name}
          imageIndex={cloud.currentIndex}
          totalImages={cloud.images.length}
          drawMode
          showCounter={false}
          focus={currentFocus}
        />

        {showLeftHud && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className="rounded-md bg-black/55 px-2 py-1 text-xs tabular-nums">{formatTime(timeLeft)}</div>
            <div className="rounded-md bg-black/55 px-2 py-1 text-xs tabular-nums">
              {currentIdx + 1}/{Math.max(intervals.length, 1)}
            </div>
            {isDetailMode && (
              <div className="rounded-md bg-black/55 px-2 py-1 text-xs">
                {currentFocus.label}
              </div>
            )}
          </div>
        )}

        <div className="absolute left-0 top-0 bottom-0 z-30 w-8">
          <AnimatePresence>
            {showDrawControls && !poseDrawerOpen && (
              <motion.button
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-md bg-black/70 p-2 hover:bg-black/90"
                onClick={() => setPoseDrawerOpen(true)}
                title="Open pose queue"
              >
                <ChevronRight size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {poseDrawerOpen && (
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="absolute left-0 top-0 bottom-0 z-40 w-[320px] bg-black/80 backdrop-blur-md border-r border-white/10 p-3 overflow-y-auto"
              onMouseLeave={() => setPoseDrawerOpen(false)}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/70">Pose Queue</span>
                <button
                  onClick={() => setPoseDrawerOpen(false)}
                  className="rounded-md p-1 hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {intervals.map((interval, idx) => {
                  const img = cloud.images[idx % Math.max(cloud.images.length, 1)];
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={interval.id}
                      onClick={() => goToPose(idx)}
                      className={cn(
                        "w-full overflow-hidden rounded-lg border text-left transition-all",
                        isCurrent ? "border-white/70 ring-2 ring-white/20" : "border-white/10 hover:border-white/40"
                      )}
                    >
                      {img ? (
                        <div className="h-40 w-full bg-black/50">
                          <img src={img.path} alt={img.name} className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div className="h-40 w-full bg-white/10" />
                      )}
                      <div className="p-2 text-xs">
                        <div className="text-white/90">Pose {idx + 1}</div>
                        <div className="text-white/60">{formatTime(interval.duration)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDrawControls && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute top-4 right-4 z-30 flex items-center gap-2"
            >
              <button
                onClick={() => setIsSilentMode((prev) => !prev)}
                className="rounded-md bg-black/60 p-2 hover:bg-black/80 transition-colors"
                title={isSilentMode ? "Silent mode on" : "Silent mode off"}
              >
                {isSilentMode ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <button
                onClick={() => setIsDetailMode((prev) => !prev)}
                className="rounded-md bg-black/60 p-2 hover:bg-black/80 transition-colors"
                title={isDetailMode ? "Detail mode on" : "Detail mode off"}
              >
                <ScanSearch size={14} />
              </button>
              <button
                onClick={() => setIsDrawMode(false)}
                className="rounded-md bg-black/60 p-2 hover:bg-black/80 transition-colors"
                title="Exit drawing mode"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
          {showDrawControls && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={toggleTimer}
              className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-stone-900 text-stone-50 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl hover:bg-stone-800"
            >
              {isActive ? (
                <Pause size={32} fill="currentColor" strokeWidth={0} />
              ) : (
                <Play size={32} fill="currentColor" strokeWidth={0} className="ml-1" />
              )}
            </motion.button>
          )}
        </AnimatePresence>

      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row h-screen w-full font-sans selection:bg-stone-300",
        isDark ? "bg-stone-900 text-stone-100" : "bg-[#F5F5F4] text-stone-900"
      )}
    >
      <AnimatePresence>
        {detailEditorOpen && cloud.images.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-black/50"
              onClick={() => setDetailEditorOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="fixed inset-4 z-[91] rounded-xl bg-stone-950 border border-white/10 p-3"
            >
              <div className="mb-2 flex items-center justify-between text-white gap-2">
                <span className="text-sm">Add and adjust detail areas (multiple rectangles)</span>
                <div className="flex items-center gap-2">
                  <select
                    className="h-8 rounded-md bg-white/10 px-2 text-xs outline-none"
                    value={detailEditorImageIndex}
                    onChange={(e) => setDetailEditorImageIndex(Number(e.target.value))}
                  >
                    {cloud.images.map((img, idx) => (
                      <option key={img.path} value={idx}>
                        {idx + 1}. {img.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      const imageKey = getImageKeyByIndex(detailEditorImageIndex);
                      const current = getDetailRectsForImage(imageKey);
                      const next = [...current, { x: 0.35, y: 0.25, w: 0.3, h: 0.35 }];
                      setDetailRectsByImage((prev) => ({ ...prev, [imageKey]: next }));
                      setSelectedDetailIndexByImage((prev) => ({ ...prev, [imageKey]: next.length - 1 }));
                    }}
                  >
                    + Area
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      const imageKey = getImageKeyByIndex(detailEditorImageIndex);
                      const current = getDetailRectsForImage(imageKey);
                      const selectedIdx = getSelectedDetailIndexForImage(imageKey, current.length);
                      if (current.length <= 1) return;
                      const next = current.filter((_, idx) => idx !== selectedIdx);
                      setDetailRectsByImage((prev) => ({ ...prev, [imageKey]: next }));
                      setSelectedDetailIndexByImage((prev) => ({
                        ...prev,
                        [imageKey]: Math.max(0, Math.min(selectedIdx, next.length - 1)),
                      }));
                    }}
                    disabled={getDetailRectsForImage(getImageKeyByIndex(detailEditorImageIndex)).length <= 1}
                  >
                    Remove
                  </Button>
                  <button
                    onClick={() => setDetailEditorOpen(false)}
                    className="rounded-md bg-white/10 p-2 hover:bg-white/20"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="relative h-[calc(100%-2.25rem)] w-full overflow-hidden rounded-lg bg-black">
                <img src={cloud.images[detailEditorImageIndex]?.path} alt="Detail setup" className="h-full w-full object-contain" />
                {getDetailRectsForImage(getImageKeyByIndex(detailEditorImageIndex)).map((rect, idx) => {
                  const imageKey = getImageKeyByIndex(detailEditorImageIndex);
                  const selected = idx === getSelectedDetailIndexForImage(
                    imageKey,
                    getDetailRectsForImage(imageKey).length
                  );
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "absolute border-2 cursor-move",
                        selected ? "border-lime-400 bg-lime-400/15 z-20" : "border-sky-300/80 bg-sky-300/10 z-10"
                      )}
                      style={{
                        left: `${rect.x * 100}%`,
                        top: `${rect.y * 100}%`,
                        width: `${rect.w * 100}%`,
                        height: `${rect.h * 100}%`,
                      }}
                      onMouseDown={(e) => {
                        setSelectedDetailIndexByImage((prev) => ({ ...prev, [imageKey]: idx }));
                        startDetailEdit(e, "move");
                      }}
                    >
                      <div className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">
                        {idx + 1}
                      </div>
                      {selected && (
                        <div
                          className="absolute -right-2 -bottom-2 h-4 w-4 rounded-sm bg-lime-400 border border-black cursor-se-resize"
                          onMouseDown={(e) => startDetailEdit(e, "resize")}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Mobile Header --- */}
      <header
        className={cn(
          "lg:hidden flex items-center justify-between px-4 py-3 border-b backdrop-blur-sm z-30 shrink-0",
          isDark ? "border-stone-700 bg-stone-900/90" : "border-stone-200 bg-white/80"
        )}
      >
        <button
          onClick={() => { setSidebarOpen(!sidebarOpen); setMusicOpen(false); }}
          className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-stone-900 rounded-md flex items-center justify-center text-white">
            <Clock size={14} />
          </div>
          <span className="font-bold text-base tracking-tight">GestureFlow</span>
        </div>

        <button
          onClick={() => { setMusicOpen(!musicOpen); setSidebarOpen(false); }}
          className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <Music2 size={20} />
        </button>
      </header>

      {/* --- Mobile Sidebar Overlay --- */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed top-0 left-0 bottom-0 w-75 z-50 lg:hidden overflow-y-auto shadow-xl",
                isDark ? "bg-stone-900 text-stone-100" : "bg-white"
              )}
            >
              <div className={cn("p-4 border-b flex items-center justify-between", isDark ? "border-stone-700" : "border-stone-200")}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
                    <Clock size={18} />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight">GestureFlow</h1>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-6">
                <SetupSection />
                <TimelineSection />
                <CloudPanel
                  isConnected={cloud.isConnected}
                  folderPath={cloud.folderPath}
                  images={cloud.images}
                  loading={cloud.loading}
                  error={cloud.error}
                  rotationMode={cloud.rotationMode}
                  openLocalFolder={cloud.openLocalFolder}
                  disconnect={cloud.disconnect}
                  setFolderPath={cloud.setFolderPath}
                  loadFolder={cloud.loadFolder}
                  setRotationMode={cloud.setRotationMode}
                  clearError={cloud.clearError}
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setDetailEditorImageIndex(cloud.currentIndex);
                    setDetailEditorOpen(true);
                  }}
                  disabled={cloud.images.length === 0 || isActive}
                  title={cloud.images.length === 0 ? "Open local folder first" : undefined}
                >
                  Detail Area
                </Button>
              </div>
              {onSwitchToClassic && (
                <div className={cn("p-4 border-t", isDark ? "border-stone-700" : "border-stone-200")}>
                  <div className="flex items-center gap-2">
                    <ThemeControls />
                    <UiButton
                      variant="outline"
                      className="flex-1 justify-center text-sm"
                      onClick={onSwitchToClassic}
                    >
                      Classic View
                    </UiButton>
                  </div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- Mobile Music Overlay --- */}
      <AnimatePresence>
        {musicOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setMusicOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed top-0 right-0 bottom-0 w-[320px] z-50 lg:hidden overflow-y-auto shadow-xl flex flex-col",
                isDark ? "bg-stone-900 text-stone-100" : "bg-white"
              )}
            >
              <div className="flex justify-end p-3">
                <button onClick={() => setMusicOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <Playlist compact />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- Desktop Left Sidebar --- */}
      <aside
        className={cn(
          "hidden lg:flex flex-col backdrop-blur-sm z-10 shrink-0 overflow-hidden relative transition-all",
          resizingPanel ? "duration-0" : "duration-300",
          leftPanelCollapsed ? "border-r-0" : isDark ? "border-r border-stone-700 bg-stone-900/70" : "border-r border-stone-200 bg-white/50"
        )}
        style={{ width: leftPanelCollapsed ? 0 : leftPanelWidth }}
      >
        {!leftPanelCollapsed && (
          <>
            <div className={cn("p-6 border-b flex items-center justify-between gap-2", isDark ? "border-stone-700" : "border-stone-200")}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white shrink-0">
                  <Clock size={18} />
                </div>
                <h1 className="text-xl font-bold tracking-tight truncate">GestureFlow</h1>
              </div>
              <UiButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setLeftPanelCollapsed(true)}
                title="Collapse left panel"
              >
                <PanelLeftClose size={16} />
              </UiButton>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <SetupSection />
              <TimelineSection />
              <CloudPanel
                isConnected={cloud.isConnected}
                folderPath={cloud.folderPath}
                images={cloud.images}
                loading={cloud.loading}
                error={cloud.error}
                rotationMode={cloud.rotationMode}
                openLocalFolder={cloud.openLocalFolder}
                disconnect={cloud.disconnect}
                setFolderPath={cloud.setFolderPath}
                loadFolder={cloud.loadFolder}
                setRotationMode={cloud.setRotationMode}
                clearError={cloud.clearError}
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setDetailEditorImageIndex(cloud.currentIndex);
                  setDetailEditorOpen(true);
                }}
                disabled={cloud.images.length === 0 || isActive}
                title={cloud.images.length === 0 ? "Open local folder first" : undefined}
              >
                Detail Area
              </Button>
            </div>

            {onSwitchToClassic && (
              <div className={cn("p-4 border-t", isDark ? "border-stone-700" : "border-stone-200")}>
                <div className="flex items-center gap-2">
                  <ThemeControls />
                  <UiButton
                    variant="outline"
                    className="flex-1 justify-center text-xs"
                    onClick={onSwitchToClassic}
                  >
                    Classic View
                  </UiButton>
                </div>
              </div>
            )}
            <div
              onMouseDown={(e) => startPanelResize("left", e)}
              className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-stone-300/50"
              title="Resize panel"
            />
          </>
        )}
      </aside>

      {/* --- Center: Main Display --- */}
      <main className="flex-1 flex flex-col relative overflow-y-auto lg:overflow-hidden min-h-0">
        {leftPanelCollapsed && (
          <UiButton
            variant="ghost"
            size="icon-sm"
            onClick={() => setLeftPanelCollapsed(false)}
            className="hidden lg:inline-flex absolute top-3 left-3 z-20 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70"
            title="Expand left panel"
          >
            <PanelLeftOpen size={16} />
          </UiButton>
        )}
        {rightPanelCollapsed && (
          <UiButton
            variant="ghost"
            size="icon-sm"
            onClick={() => setRightPanelCollapsed(false)}
            className="hidden lg:inline-flex absolute top-3 right-3 z-20 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70"
            title="Expand music panel"
          >
            <Music2 size={16} />
          </UiButton>
        )}
        {/* Reference image from cloud */}
        {cloud.currentImageUrl && (
          <ImageDisplay
            src={cloud.currentImageUrl}
            imageName={cloud.images[cloud.currentIndex]?.name}
            imageIndex={cloud.currentIndex}
            totalImages={cloud.images.length}
          />
        )}

        {/* Abstract Background Decoration (hidden when image is shown) */}
        {!cloud.currentImageUrl && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-stone-900 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-stone-900 rounded-full blur-3xl" />
          </div>
        )}

        {/* Timer section — centered on desktop, top-aligned on mobile */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center w-full max-w-2xl mx-auto px-4 md:px-8 pt-6 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentIdx}
            className="mb-4 md:mb-8"
          >
            <h2 className="text-stone-500 font-medium tracking-wide uppercase text-xs md:text-sm mb-2 md:mb-4">
              Current Pose &bull; {currentIdx + 1} of {intervals.length}
            </h2>

            <div className="relative flex items-center justify-center">
               <span className={cn(
                 "text-7xl sm:text-8xl md:text-[10rem] lg:text-[12rem] leading-none font-bold tabular-nums tracking-tighter text-stone-900 select-none",
                 cloud.currentImageUrl && "drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]"
               )}>
                 {formatTime(timeLeft)}
               </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-stone-200 rounded-full mt-4 md:mt-8 overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: "lightgreen" }}
                initial={{ width: "100%" }}
                animate={{ width: `${(((currentInterval?.duration || 1) - timeLeft) / (currentInterval?.duration || 1)) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
          </motion.div>

          {/* Next Up Indicator */}
          <div className="h-10 md:h-16 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {nextInterval && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-stone-400"
                >
                  <span className="text-xs md:text-sm">Up Next:</span>
                  <span className="text-stone-600 font-semibold text-sm md:text-base">{formatTime(nextInterval.duration)} Pose</span>
                </motion.div>
              )}
              {!nextInterval && (
                <span className="text-stone-400 text-xs md:text-sm">Final Pose</span>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <TimerControls />
        </div>

        {/* Mobile: Session Timeline below timer */}
        <div className="lg:hidden relative z-10 w-full max-w-2xl mx-auto px-4 pb-6 pt-4">
          <TimelineSection />
        </div>
      </main>

      {/* --- Desktop Right Sidebar: Music --- */}
      <aside
        className={cn(
          "hidden lg:flex backdrop-blur-sm z-10 flex-col shrink-0 overflow-hidden relative transition-all",
          resizingPanel ? "duration-0" : "duration-300",
          rightPanelCollapsed ? "border-l-0" : isDark ? "border-l border-stone-700 bg-stone-900/70" : "border-l border-stone-200 bg-white/50"
        )}
        style={{ width: rightPanelCollapsed ? 0 : rightPanelWidth }}
      >
        {!rightPanelCollapsed && (
          <>
            <div className="flex-1 min-h-0">
              <Playlist compact onCollapse={() => setRightPanelCollapsed(true)} />
            </div>
            <div
              onMouseDown={(e) => startPanelResize("right", e)}
              className="absolute top-0 left-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-stone-300/50"
              title="Resize panel"
            />
          </>
        )}
      </aside>
    </div>
  );
};
