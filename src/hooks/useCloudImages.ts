import { useState, useCallback, useRef } from "react";
import type { CloudImage, CloudError, RotationMode } from "@/services/cloud/types";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp"]);

export interface CloudImagesState {
  isConnected: boolean;
  folderPath: string;
  images: CloudImage[];
  currentIndex: number;
  currentImageUrl: string | null;
  rotationMode: RotationMode;
  loading: boolean;
  error: CloudError | null;
}

export interface CloudImagesActions {
  openLocalFolder: () => Promise<void>;
  disconnect: () => void;
  setFolderPath: (path: string) => void;
  loadFolder: () => Promise<void>;
  goToImage: (index: number) => void;
  nextImage: () => void;
  prevImage: () => void;
  setRotationMode: (mode: RotationMode) => void;
  resetImages: () => void;
  clearError: () => void;
}

export function useCloudImages(): CloudImagesState & CloudImagesActions {
  const [isConnected, setIsConnected] = useState(false);
  const [folderPath, setFolderPath] = useState("/");
  const [images, setImages] = useState<CloudImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [rotationMode, setRotationMode] = useState<RotationMode>("sequential");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CloudError | null>(null);

  const preloadedUrls = useRef<Map<number, string>>(new Map());
  const localBlobUrls = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadLocalFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      setError({ code: "unknown", message: "No files selected" });
      return;
    }

    setLoading(true);
    setError(null);
    localBlobUrls.current.forEach((u) => URL.revokeObjectURL(u));
    localBlobUrls.current = [];
    preloadedUrls.current.clear();

    const imgs: CloudImage[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!IMAGE_EXTS.has(ext)) continue;
      const blobUrl = URL.createObjectURL(file);
      localBlobUrls.current.push(blobUrl);
      imgs.push({ name: file.name, path: blobUrl, size: file.size, mimeType: file.type || "image/jpeg" });
    }

    imgs.sort((a, b) => a.name.localeCompare(b.name));

    if (imgs.length === 0) {
      setError({ code: "no_images", message: "No images found in this folder" });
      setLoading(false);
      return;
    }

    setImages(imgs);
    setCurrentIndex(0);
    setCurrentImageUrl(imgs[0].path);
    setIsConnected(true);
    setLoading(false);
  }, []);

  const openLocalFolderWithInputFallback = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.setAttribute("webkitdirectory", "");
      input.style.display = "none";
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    const input = fileInputRef.current;
    input.onchange = () => {
      loadLocalFiles(input.files);
      input.value = "";
    };
    input.click();
  }, [loadLocalFiles]);

  const openLocalFolder = useCallback(async () => {
    if (!("showDirectoryPicker" in window)) {
      openLocalFolderWithInputFallback();
      return;
    }

    try {
      const handle = await (window as unknown as { showDirectoryPicker: (o?: object) => Promise<FileSystemDirectoryHandle> })
        .showDirectoryPicker({ mode: "read" });

      setLoading(true);
      setError(null);
      localBlobUrls.current.forEach((u) => URL.revokeObjectURL(u));
      localBlobUrls.current = [];
      preloadedUrls.current.clear();

      const imgs: CloudImage[] = [];
      type DirEntries = { entries(): AsyncIterableIterator<[string, FileSystemHandle]> };
      for await (const [name, entry] of (handle as unknown as DirEntries).entries()) {
        if (entry.kind !== "file") continue;
        const ext = name.split(".").pop()?.toLowerCase() ?? "";
        if (!IMAGE_EXTS.has(ext)) continue;
        const file = await (entry as FileSystemFileHandle).getFile();
        const blobUrl = URL.createObjectURL(file);
        localBlobUrls.current.push(blobUrl);
        imgs.push({ name, path: blobUrl, size: file.size, mimeType: file.type || "image/jpeg" });
      }

      imgs.sort((a, b) => a.name.localeCompare(b.name));

      if (imgs.length === 0) {
        setError({ code: "no_images", message: "No images found in this folder" });
        setLoading(false);
        return;
      }

      setImages(imgs);
      setCurrentIndex(0);
      setCurrentImageUrl(imgs[0].path);
      setIsConnected(true);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      openLocalFolderWithInputFallback();
      return;
    } finally {
      setLoading(false);
    }
  }, [openLocalFolderWithInputFallback]);

  const disconnect = useCallback(() => {
    localBlobUrls.current.forEach((u) => URL.revokeObjectURL(u));
    localBlobUrls.current = [];
    setIsConnected(false);
    setImages([]);
    setCurrentIndex(0);
    setCurrentImageUrl(null);
    preloadedUrls.current.clear();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const resolveUrl = useCallback(async (idx: number, imgs: CloudImage[]): Promise<string | null> => {
    if (idx < 0 || idx >= imgs.length) return null;
    return imgs[idx].path;
  }, []);

  const preloadImage = useCallback((url: string) => {
    const img = new Image();
    img.src = url;
  }, []);

  const loadCurrentImage = useCallback(
    async (idx: number, imgs: CloudImage[]) => {
      const url = await resolveUrl(idx, imgs);
      setCurrentImageUrl(url);

      const nextIdx = (idx + 1) % imgs.length;
      if (nextIdx !== idx) {
        const nextUrl = await resolveUrl(nextIdx, imgs);
        if (nextUrl) preloadImage(nextUrl);
      }
    },
    [resolveUrl, preloadImage]
  );

  const loadFolder = useCallback(async () => {
    if (images.length === 0) {
      setError({ code: "not_found", message: "Open local folder first" });
      return;
    }
    await loadCurrentImage(0, images);
  }, [images, loadCurrentImage]);

  const nextImage = useCallback(() => {
    if (images.length === 0) return;

    setCurrentIndex((prev) => {
      let next: number;
      if (rotationMode === "random") {
        next = Math.floor(Math.random() * images.length);
      } else {
        next = (prev + 1) % images.length;
      }
      void loadCurrentImage(next, images);
      return next;
    });
  }, [images, rotationMode, loadCurrentImage]);

  const goToImage = useCallback((index: number) => {
    if (images.length === 0) return;
    const normalized = Math.max(0, Math.min(index, images.length - 1));
    setCurrentIndex(normalized);
    void loadCurrentImage(normalized, images);
  }, [images, loadCurrentImage]);

  const prevImage = useCallback(() => {
    if (images.length === 0) return;

    setCurrentIndex((prev) => {
      const next = (prev - 1 + images.length) % images.length;
      void loadCurrentImage(next, images);
      return next;
    });
  }, [images, loadCurrentImage]);

  const resetImages = useCallback(() => {
    setCurrentIndex(0);
    if (images.length > 0) {
      void loadCurrentImage(0, images);
    }
  }, [images, loadCurrentImage]);

  return {
    isConnected,
    folderPath,
    images,
    currentIndex,
    currentImageUrl,
    rotationMode,
    loading,
    error,
    openLocalFolder,
    disconnect,
    setFolderPath,
    loadFolder,
    goToImage,
    nextImage,
    prevImage,
    setRotationMode,
    resetImages,
    clearError,
  };
}
