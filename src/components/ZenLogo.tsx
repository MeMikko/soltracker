"use client";

import Image from "next/image";
import { ZENERATING } from "@/lib/brand/zenerating";

const SIZES = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 72,
  xl: 112,
  hero: 160,
} as const;

type ZenLogoSize = keyof typeof SIZES;

interface ZenLogoProps {
  size?: ZenLogoSize;
  showGlow?: boolean;
  className?: string;
}

function orbitVisible(size: ZenLogoSize): boolean {
  return size !== "xs";
}

export function ZenLogo({
  size = "sm",
  showGlow = false,
  className = "",
}: ZenLogoProps) {
  const px = SIZES[size];
  const hero = size === "hero" || size === "xl";
  const showOrbit = orbitVisible(size);
  const imageSize = Math.round(px * 0.88);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: px, height: px }}
      role="img"
      aria-label={`${ZENERATING.name} logo`}
    >
      {showGlow && (
        <span
          className={`absolute z-0 rounded-full bg-gradient-to-br from-zen-cyan/50 via-zen-purple/35 to-transparent blur-3xl ${
            hero
              ? "-inset-[55%] animate-zen-breathe"
              : "-inset-[40%] animate-zen-breathe opacity-90"
          }`}
          aria-hidden
        />
      )}

      <span
        className="relative z-10 overflow-hidden rounded-full bg-zen-deep"
        style={{ width: imageSize, height: imageSize }}
      >
        <Image
          src="/zenlogo.jpg"
          alt={`${ZENERATING.name} logo`}
          width={imageSize}
          height={imageSize}
          className="h-full w-full scale-[1.18] object-cover object-center"
          priority={hero}
        />
      </span>

      {showOrbit && (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ width: imageSize, height: imageSize }}
          aria-hidden
        >
          <svg
            viewBox="0 0 100 100"
            width={imageSize}
            height={imageSize}
            className="animate-zen-spin-slow overflow-visible"
            fill="none"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="rgba(34, 211, 238, 0.7)"
              strokeWidth="0.65"
              strokeDasharray="5 8"
            />
            <path
              d="M 16 50 Q 32 26 50 16 Q 68 26 84 50"
              stroke="rgba(167, 139, 250, 0.65)"
              strokeWidth="0.7"
            />
            <path
              d="M 20 70 Q 38 84 50 86 Q 62 84 80 70"
              stroke="rgba(125, 211, 252, 0.55)"
              strokeWidth="0.65"
            />
            <line
              x1="6"
              y1="50"
              x2="94"
              y2="50"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="0.35"
            />
            <line
              x1="50"
              y1="6"
              x2="50"
              y2="94"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="0.35"
            />
            {[
              [18, 32],
              [82, 30],
              [24, 76],
              [76, 78],
              [50, 10],
              [10, 50],
              [90, 50],
            ].map(([cx, cy]) => (
              <circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r="1.2"
                fill="rgba(34, 211, 238, 0.9)"
              />
            ))}
          </svg>
        </span>
      )}
    </span>
  );
}