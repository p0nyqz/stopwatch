import React, { useState } from "react";
import { FolderOpen, Folder, Loader2, ImageIcon, AlertCircle, LogOut } from "lucide-react";
import type { CloudImagesState, CloudImagesActions } from "@/hooks/useCloudImages";

type Props = Pick<
  CloudImagesState & CloudImagesActions,
  | "isConnected"
  | "folderPath"
  | "images"
  | "loading"
  | "error"
  | "rotationMode"
  | "openLocalFolder"
  | "disconnect"
  | "setFolderPath"
  | "loadFolder"
  | "setRotationMode"
  | "clearError"
>;

export const CloudPanel: React.FC<Props> = ({
  isConnected,
  folderPath,
  images,
  loading,
  error,
  rotationMode,
  openLocalFolder,
  disconnect,
  setFolderPath,
  loadFolder,
  setRotationMode,
  clearError,
}) => {
  const [inputPath, setInputPath] = useState(folderPath === "/" ? "" : folderPath);

  const handleLoad = () => {
    const path = inputPath.trim() || "/";
    setFolderPath(path);
    setTimeout(() => loadFolder(), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoad();
  };

  return (
    <section className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">Reference Images</label>

      {!isConnected ? (
        <div className="space-y-2">
          <button
            onClick={openLocalFolder}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-stone-300 bg-stone-50 hover:bg-white hover:border-stone-400 transition-all text-sm font-medium text-stone-800 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Folder size={16} />}
            Open Local Folder
          </button>

          <p className="text-[10px] text-stone-400 leading-tight">
            Works in modern browsers. If system folder picker is unavailable, fallback file-input picker is used.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Local Folder
            </div>
            <button
              onClick={disconnect}
              className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
              title="Disconnect"
            >
              <LogOut size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              placeholder="/Drawing/Poses"
              className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-stone-200 text-stone-900 hover:bg-stone-300 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
            </button>
          </form>

          {images.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <ImageIcon size={12} />
                {images.length} images
              </div>
              <select
                value={rotationMode}
                onChange={(e) => setRotationMode(e.target.value as "sequential" | "random")}
                className="text-xs bg-transparent text-stone-500 border-none outline-none cursor-pointer"
              >
                <option value="sequential">Sequential</option>
                <option value="random">Random</option>
              </select>
            </div>
          )}
        </div>
      )}

      {error && (
        <button
          onClick={clearError}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs text-left"
        >
          <AlertCircle size={14} className="shrink-0" />
          <span className="flex-1">{error.message}</span>
        </button>
      )}
    </section>
  );
};
