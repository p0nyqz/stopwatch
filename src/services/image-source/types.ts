export interface ImageItem {
  name: string;
  path: string;
  size: number;
  mimeType: string;
  url?: string;
}

export interface ImageSourceProvider {
  connect(): Promise<void>;
  listImages(path: string): Promise<ImageItem[]>;
}

export type ImageSourceErrorCode =
  | "unauthorized"
  | "token_invalid"
  | "forbidden"
  | "not_found"
  | "invalid_path"
  | "network"
  | "not_connected"
  | "unsupported"
  | "no_images"
  | "unknown";

export class ImageSourceError extends Error {
  readonly code: ImageSourceErrorCode;
  readonly status?: number;

  constructor(code: ImageSourceErrorCode, message: string, status?: number) {
    super(message);
    this.name = "ImageSourceError";
    this.code = code;
    this.status = status;
  }
}
