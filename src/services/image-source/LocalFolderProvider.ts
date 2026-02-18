import { ImageSourceError, type ImageItem, type ImageSourceProvider } from "./types";

const ALLOWED_IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]);

export class LocalFolderProvider implements ImageSourceProvider {
  private dirHandle: FileSystemDirectoryHandle | null = null;
  private blobUrls: string[] = [];

  async connect(): Promise<void> {
    if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
      throw new ImageSourceError("unsupported", "File System Access API is not available");
    }

    const picker = window.showDirectoryPicker as (options?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
    this.dirHandle = await picker({ mode: "read" });
  }

  async listImages(_path: string): Promise<ImageItem[]> {
    if (!this.dirHandle) {
      throw new ImageSourceError("not_connected", "Local folder is not selected. Call connect() first");
    }

    this.revokeBlobUrls();

    const images: ImageItem[] = [];
    type DirEntries = { entries(): AsyncIterableIterator<[string, FileSystemHandle]> };
    for await (const [name, handle] of (this.dirHandle as unknown as DirEntries).entries()) {
      if (handle.kind !== "file") continue;
      if (!this.isImage(name)) continue;

      const file = await (handle as FileSystemFileHandle).getFile();
      const url = URL.createObjectURL(file);
      this.blobUrls.push(url);

      images.push({
        name,
        path: name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        url,
      });
    }

    images.sort((a, b) => a.name.localeCompare(b.name));

    if (images.length === 0) {
      throw new ImageSourceError("no_images", "No images found in selected local folder");
    }

    return images;
  }

  dispose(): void {
    this.revokeBlobUrls();
    this.dirHandle = null;
  }

  private revokeBlobUrls(): void {
    for (const url of this.blobUrls) {
      URL.revokeObjectURL(url);
    }
    this.blobUrls = [];
  }

  private isImage(fileName: string): boolean {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    return ALLOWED_IMAGE_EXT.has(ext);
  }
}
