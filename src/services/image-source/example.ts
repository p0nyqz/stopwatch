import { LocalFolderProvider, type ImageSourceProvider } from "./index";

export async function loadImages(provider: ImageSourceProvider, path: string) {
  await provider.connect();
  return provider.listImages(path);
}

export async function loadFromLocalFolder() {
  const provider = new LocalFolderProvider();
  return loadImages(provider, "");
}
