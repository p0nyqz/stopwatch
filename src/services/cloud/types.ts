export interface CloudImage {
  name: string;
  path: string;
  size: number;
  mimeType: string;
  previewUrl?: string;
  downloadUrl?: string;
}

export interface CloudError {
  code: "not_found" | "no_images" | "network" | "invalid_path" | "unknown";
  message: string;
  status?: number;
}

export type RotationMode = "sequential" | "random";
