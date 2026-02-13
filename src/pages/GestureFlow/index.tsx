import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  Music2,
  ListMusic,
  Clock,
  Plus,
  X,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

const PRESETS: Preset[] = [
  { name: "Gesture Warmup", intervals: [30, 30, 30, 30, 30, 60, 60, 60] },
  { name: "Figure Study", intervals: [120, 120, 300, 300, 600] },
  { name: "Long Poses", intervals: [600, 1200, 1200] },
];

const MOCK_PLAYLIST = [
  {
    id: 1,
    title: "Incoming",
    artist: "Julian Winding",
    cover: "https://images.unsplash.com/photo-1645919268997-e8f6d5ee81e6?q=80&w=200&auto=format&fit=crop",
    duration: "4:32"
  },
  {
    id: 2,
    title: "Powder Room",
    artist: "Julian Winding",
    cover: "https://images.unsplash.com/photo-1649346716613-d92f359d0c2c?q=80&w=200&auto=format&fit=crop",
    duration: "3:45"
  },
  {
    id: 3,
    title: "The Demon Dance",
    artist: "Julian Winding",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop",
    duration: "5:12"
  },
  {
    id: 4,
    title: "Darkness Old Friend",
    artist: "Julian Winding",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop",
    duration: "4:01"
  }
];

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
};

export const GestureFlowPage: React.FC<GestureFlowPageProps> = ({ onSwitchToClassic }) => {
  // State
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [inputStr, setInputStr] = useState("30, 60, 300");
  const [currentSongIdx, setCurrentSongIdx] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicProgress, setMusicProgress] = useState(30);

  // Mobile/tablet UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

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
          if (isActive && "speechSynthesis" in window) {
             if (newTime === 30) {
               const u = new SpeechSynthesisUtterance("30 seconds remaining");
               window.speechSynthesis.speak(u);
             } else if (newTime === 10) {
               const u = new SpeechSynthesisUtterance("Prepare to change pose");
               window.speechSynthesis.speak(u);
             }
          }

          return newTime;
        });

        // Simulate music progress while timer runs for visual effect
        if (isMusicPlaying) {
          setMusicProgress(p => (p + 0.1) % 100);
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Next interval
      if (currentIdx < intervals.length - 1) {
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        setTimeLeft(intervals[nextIdx].duration);

        // Voice Notification
        if ("speechSynthesis" in window) {
           const utterance = new SpeechSynthesisUtterance("Change pose");
           utterance.rate = 1.1;
           window.speechSynthesis.speak(utterance);
        }
      } else {
        setIsActive(false);
        if ("speechSynthesis" in window) {
           const utterance = new SpeechSynthesisUtterance("Session complete");
           window.speechSynthesis.speak(utterance);
        }
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, currentIdx, intervals, isMusicPlaying]);

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

  const toggleTimer = () => setIsActive(!isActive);

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

  const MusicContent = () => (
    <>
      {/* Apple Music Header Mock */}
      <div className="p-4 lg:p-6 flex items-center justify-between border-b border-stone-200/50">
        <div className="flex items-center gap-1.5 text-stone-900">
          <Music2 size={18} fill="currentColor" />
          <span className="font-semibold text-sm">Music</span>
        </div>
        <button className="text-xs font-medium bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-full text-stone-600 transition-colors">
          Sign In
        </button>
      </div>

      {/* Current Track */}
      <div className="p-4 lg:p-6 flex-1 flex flex-col">
        <div className="aspect-square w-full max-w-70 mx-auto lg:max-w-none bg-stone-100 rounded-xl mb-4 lg:mb-6 shadow-md overflow-hidden relative group">
           <img
             src={MOCK_PLAYLIST[currentSongIdx].cover}
             alt="Album Art"
             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
           />
           {/* Play overlay */}
           <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                className="w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all"
              >
                {isMusicPlaying ? <Pause size={20} className="text-stone-900" fill="currentColor" strokeWidth={0} /> : <Play size={20} className="ml-1 text-stone-900" fill="currentColor" strokeWidth={0} />}
              </button>
           </div>
        </div>

        <div className="space-y-1 mb-4 lg:mb-6">
          <h3 className="font-bold text-lg text-stone-900 leading-tight">
            {MOCK_PLAYLIST[currentSongIdx].title}
          </h3>
          <p className="text-stone-500 text-sm">
            {MOCK_PLAYLIST[currentSongIdx].artist}
          </p>
        </div>

        {/* Progress Mock */}
        <div className="space-y-2 mb-6 lg:mb-8">
          <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-400 rounded-full"
              style={{ width: `${musicProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-medium text-stone-400 tabular-nums">
            <span>1:24</span>
            <span>-{MOCK_PLAYLIST[currentSongIdx].duration}</span>
          </div>
        </div>

        {/* Music Controls */}
        <div className="flex items-center justify-center gap-6 text-stone-800 mb-6 lg:mb-8">
           <button
            onClick={() => setCurrentSongIdx(i => (i - 1 + MOCK_PLAYLIST.length) % MOCK_PLAYLIST.length)}
            className="hover:text-stone-500 transition-colors"
           >
             <SkipForward size={24} className="rotate-180" fill="currentColor" strokeWidth={0} />
           </button>
           <button
             onClick={() => setIsMusicPlaying(!isMusicPlaying)}
             className="hover:scale-110 transition-transform"
           >
             {isMusicPlaying ? (
               <Pause size={40} fill="currentColor" strokeWidth={0} />
             ) : (
               <Play size={40} fill="currentColor" strokeWidth={0} />
             )}
           </button>
           <button
            onClick={() => setCurrentSongIdx(i => (i + 1) % MOCK_PLAYLIST.length)}
            className="hover:text-stone-500 transition-colors"
           >
             <SkipForward size={24} fill="currentColor" strokeWidth={0} />
           </button>
        </div>

        <div className="mt-auto">
           <div className="flex items-center gap-2 mb-4">
              <ListMusic size={16} className="text-stone-400" />
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Up Next</span>
           </div>
           <div className="space-y-2">
             {MOCK_PLAYLIST.map((track, i) => (
               <button
                 key={track.id}
                 onClick={() => setCurrentSongIdx(i)}
                 className={cn(
                   "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-stone-100 transition-colors text-left group",
                   currentSongIdx === i ? "bg-stone-100" : ""
                 )}
               >
                 <div className="w-8 h-8 rounded bg-stone-200 overflow-hidden relative shrink-0">
                    <img src={track.cover} className="w-full h-full object-cover" />
                    {currentSongIdx === i && isMusicPlaying && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="flex gap-0.5 items-end h-3">
                           <motion.div animate={{ height: [4, 12, 6] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white" />
                           <motion.div animate={{ height: [10, 5, 12] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-white" />
                           <motion.div animate={{ height: [6, 12, 4] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-1 bg-white" />
                        </div>
                      </div>
                    )}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className={cn("text-sm font-medium truncate", currentSongIdx === i ? "text-stone-900" : "text-stone-600")}>
                     {track.title}
                   </div>
                   <div className="text-xs text-stone-400 truncate">
                     {track.artist}
                   </div>
                 </div>
                 {currentSongIdx === i && (
                   <Volume2 size={14} className="text-stone-400 shrink-0" />
                 )}
               </button>
             ))}
           </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F5F5F4] text-stone-900 font-sans selection:bg-stone-300">

      {/* --- Mobile Header --- */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white/80 backdrop-blur-sm z-30 shrink-0">
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
              className="fixed top-0 left-0 bottom-0 w-75 bg-white z-50 lg:hidden overflow-y-auto shadow-xl"
            >
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
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
              </div>
              {onSwitchToClassic && (
                <div className="p-4 border-t border-stone-200">
                  <button
                    onClick={onSwitchToClassic}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    Classic View
                  </button>
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
              className="fixed top-0 right-0 bottom-0 w-[320px] bg-white z-50 lg:hidden overflow-y-auto shadow-xl flex flex-col"
            >
              <div className="flex justify-end p-3">
                <button onClick={() => setMusicOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">
                  <X size={18} />
                </button>
              </div>
              <MusicContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- Desktop Left Sidebar --- */}
      <aside className="hidden lg:flex w-80 flex-col border-r border-stone-200 bg-white/50 backdrop-blur-sm z-10 shrink-0">
        <div className="p-6 border-b border-stone-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
            <Clock size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">GestureFlow</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <SetupSection />
          <TimelineSection />
        </div>

        {onSwitchToClassic && (
          <div className="p-4 border-t border-stone-200">
            <button
              onClick={onSwitchToClassic}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors"
            >
              Classic View
            </button>
          </div>
        )}
      </aside>

      {/* --- Center: Main Display --- */}
      <main className="flex-1 flex flex-col relative overflow-y-auto lg:overflow-hidden min-h-0">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-stone-900 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-stone-900 rounded-full blur-3xl" />
        </div>

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
               <span className="text-7xl sm:text-8xl md:text-[10rem] lg:text-[12rem] leading-none font-bold tabular-nums tracking-tighter text-stone-900 select-none">
                 {formatTime(timeLeft)}
               </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-stone-200 rounded-full mt-4 md:mt-8 overflow-hidden">
              <motion.div
                className="h-full bg-stone-900"
                initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / (currentInterval?.duration || 1)) * 100}%` }}
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
      <aside className="hidden lg:flex w-80 border-l border-stone-200 bg-white/50 backdrop-blur-sm z-10 flex-col shrink-0">
        <MusicContent />
      </aside>
    </div>
  );
};
