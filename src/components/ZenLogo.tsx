"use client";

import { useId } from "react";
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
  const uid = useId().replace(/:/g, "");
  const px = SIZES[size];
  const detailed = ornamentsVisible(size);
  const hero = size === "hero" || size === "xl";

  const blobGrad = `blob-${uid}`;
  const ringGrad = `ring-${uid}`;
  const glow = `glow-${uid}`;
  const symGlow = `sym-${uid}`;

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

      <svg
        viewBox="0 0 100 100"
        width={px}
        height={px}
        className={`relative ${hero ? "drop-shadow-[0_0_28px_rgba(34,211,238,0.35)]" : "drop-shadow-[0_0_12px_rgba(139,92,246,0.25)]"}`}
        aria-hidden
      >
        <defs>
          <radialGradient id={blobGrad} cx="48%" cy="42%" r="58%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="45%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#7c3aed" />
          </radialGradient>

          <linearGradient id={ringGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>

          <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={symGlow} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {detailed && (
          <g
            className={hero ? "origin-center animate-zen-spin-slow" : undefined}
            opacity="0.45"
          >
            <ellipse
              cx="50"
              cy="50"
              rx="44"
              ry="44"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="0.35"
              strokeDasharray="2 5"
            />
            <path
              d="M 18 52 Q 34 30 50 22 Q 66 30 82 52"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.5"
            />
            <path
              d="M 24 68 Q 38 78 50 80 Q 62 78 76 68"
              fill="none"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="0.45"
            />
            {[
              [22, 38],
              [78, 36],
              [30, 72],
              [72, 74],
              [50, 18],
            ].map(([cx, cy]) => (
              <circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r="0.9"
                fill="rgba(255,255,255,0.55)"
              />
            ))}
          </g>
        )}

        <line
          x1="8"
          y1="50"
          x2="92"
          y2="50"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.35"
        />
        <line
          x1="50"
          y1="8"
          x2="50"
          y2="92"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.35"
        />

        <circle
          cx="50"
          cy="50"
          r="41"
          fill="none"
          stroke={`url(#${ringGrad})`}
          strokeWidth={hero ? 1.4 : 1.1}
          filter={`url(#${glow})`}
          opacity="0.95"
        />

        <path
          d="M 50 22
             C 62 22 68 30 68 40
             C 68 54 58 58 50 62
             C 42 58 32 54 32 40
             C 32 30 38 22 50 22 Z"
          fill={`url(#${blobGrad})`}
          opacity="0.92"
        />

        <g
          stroke="#f8fafc"
          strokeWidth={hero ? 3.4 : 2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#${symGlow})`}
        >
          <path d="M 36 34 L 36 66" />
          <path d="M 36 50 L 54 50" />
          <path d="M 54 50 L 60 38 L 66 50" />
          <path d="M 54 50 L 60 64" />
        </g>
      </svg>
    </span>
  );
}