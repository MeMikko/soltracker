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

function ornamentsVisible(size: ZenLogoSize): boolean {
  return size === "hero" || size === "xl" || size === "lg";
}

export function ZenLogo({
  size = "sm",
  showGlow = false,
  className = "",
}: ZenLogoProps) {
  const px = SIZES[size];
  const detailed = ornamentsVisible(size);
  const hero = size === "hero" || size === "xl";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: px, height: px }}
      role="img"
      aria-label={`${ZENERATING.name} logo`}
    >
      {showGlow && (
        <span
          className={`absolute rounded-full bg-gradient-to-br from-zen-cyan/35 via-zen-purple/25 to-transparent blur-2xl ${
            hero ? "inset-[-35%] animate-zen-breathe" : "inset-[-20%] opacity-80"
          }`}
          aria-hidden
        />
      )}

      {detailed && (
        <svg
          viewBox="0 0 100 100"
          width={px}
          height={px}
          className={`pointer-events-none absolute inset-0 z-0 ${
            hero ? "animate-zen-spin-slow" : ""
          }`}
          aria-hidden
        >
          <ellipse
            cx="50"
            cy="50"
            rx="46"
            ry="46"
            fill="none"
            stroke="rgba(34, 211, 238, 0.15)"
            strokeWidth="0.4"
            strokeDasharray="3 6"
          />
          <path
            d="M 16 52 Q 32 28 50 18 Q 68 28 84 52"
            fill="none"
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth="0.45"
          />
          <path
            d="M 22 70 Q 38 82 50 84 Q 62 82 78 70"
            fill="none"
            stroke="rgba(125, 155, 138, 0.18)"
            strokeWidth="0.4"
          />
          {[
            [20, 36],
            [80, 34],
            [28, 74],
            [74, 76],
            [50, 14],
          ].map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="0.85"
              fill="rgba(34, 211, 238, 0.45)"
            />
          ))}
        </svg>
      )}

      <Image
        src="/zenlogo.jpg"
        alt={`${ZENERATING.name} logo`}
        width={px}
        height={px}
        className={`relative z-10 object-contain ${
          hero
            ? "drop-shadow-[0_0_28px_rgba(34,211,238,0.3)]"
            : "drop-shadow-[0_0_10px_rgba(139,92,246,0.2)]"
        }`}
        priority={hero}
      />
    </span>
  );
}