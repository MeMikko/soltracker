"use client";

import { useState } from "react";

interface TokenSearchAvatarProps {
  symbol: string | null;
  mint: string;
  imageUrl: string | null;
  name: string | null;
  size?: "sm" | "md" | "lg";
}

export function TokenSearchAvatar({
  symbol,
  mint,
  imageUrl,
  name,
  size = "md",
}: TokenSearchAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = imageUrl && !imgError;
  const fallback = (symbol ?? name ?? mint).slice(0, 2).toUpperCase();
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 rounded-lg text-xs"
      : size === "lg"
        ? "h-20 w-20 rounded-2xl text-sm"
        : "h-12 w-12 rounded-xl text-xs";

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-zen-border/80 bg-zen-deep ${sizeClass}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name ?? symbol ?? mint}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zen-sage/15 font-bold text-zen-sage">
          {fallback}
        </div>
      )}
    </div>
  );
}