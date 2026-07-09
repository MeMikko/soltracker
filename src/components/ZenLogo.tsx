import Image from "next/image";
import { ZENERATING } from "@/lib/brand/zenerating";

const SIZES = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 72,
  xl: 112,
  hero: 144,
} as const;

type ZenLogoSize = keyof typeof SIZES;

interface ZenLogoProps {
  size?: ZenLogoSize;
  showGlow?: boolean;
  className?: string;
}

export function ZenLogo({
  size = "sm",
  showGlow = false,
  className = "",
}: ZenLogoProps) {
  const px = SIZES[size];

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: px, height: px }}
    >
      {showGlow && (
        <span
          className="absolute inset-0 rounded-full bg-gradient-to-br from-zen-cyan/30 to-zen-purple/30 blur-md animate-zen-pulse"
          aria-hidden
        />
      )}
      <Image
        src="/zenlogo.jpg"
        alt={`${ZENERATING.name} logo`}
        width={px}
        height={px}
        className="relative rounded-full object-cover ring-1 ring-white/10"
        priority={size === "hero" || size === "xl"}
      />
    </span>
  );
}