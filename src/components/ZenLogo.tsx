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
  return size === "hero" || size === "xl" || size === "lg" || size === "md";
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

      {showOrbit && (
        <span
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          aria-hidden
        >
          <svg
            viewBox="0 0 100 100"
            className="animate-zen-spin-slow"
            style={{ width: px * 1.35, height: px * 1.35 }}
          >
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="rgba(34, 211, 238, 0.55)"
            strokeWidth="0.55"
            strokeDasharray="4 7"
          />
          <path
            d="M 12 50 Q 30 22 50 12 Q 70 22 88 50"
            fill="none"
            stroke="rgba(139, 92, 246, 0.45)"
            strokeWidth="0.6"
          />
          <path
            d="M 18 72 Q 36 86 50 88 Q 64 86 82 72"
            fill="none"
            stroke="rgba(125, 155, 138, 0.4)"
            strokeWidth="0.55"
          />
          {[
            [14, 34],
            [86, 32],
            [22, 78],
            [78, 80],
            [50, 8],
            [8, 50],
            [92, 50],
          ].map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="1.1"
              fill="rgba(34, 211, 238, 0.75)"
            />
          ))}
          </svg>
        </span>
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
    </span>
  );
}