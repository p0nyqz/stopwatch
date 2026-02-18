import React, { useState } from "react";
import { ImageOff } from "lucide-react";

interface Props {
  src: string | null;
  imageName?: string;
  imageIndex?: number;
  totalImages?: number;
  drawMode?: boolean;
  showCounter?: boolean;
  focus?: {
    scale: number;
    translateX: number;
    translateY: number;
  };
}

export const ImageDisplay: React.FC<Props> = ({
  src,
  imageName,
  imageIndex,
  totalImages,
  drawMode = false,
  showCounter = true,
  focus,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Image */}
      <div className={`relative w-full h-full flex items-center justify-center ${drawMode ? "bg-black" : ""}`}>
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          </div>
        )}

        {hasError ? (
          <div className="flex flex-col items-center gap-2 text-stone-400">
            <ImageOff size={32} />
            <span className="text-xs">Failed to load image</span>
          </div>
        ) : (
          <img
            src={src}
            alt={imageName || "Reference"}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className={`w-full h-full object-contain ${drawMode ? "opacity-100" : "opacity-90"} transition-transform duration-700 ease-out`}
            style={
              focus
                ? {
                    transform: `translate(${focus.translateX}%, ${focus.translateY}%) scale(${focus.scale})`,
                  }
                : undefined
            }
            key={src}
          />
        )}
      </div>

      {/* Image counter badge */}
      {showCounter && totalImages && totalImages > 0 && (
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full tabular-nums">
          {(imageIndex ?? 0) + 1} / {totalImages}
        </div>
      )}
    </div>
  );
};
