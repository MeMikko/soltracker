import { ZENERATING } from "@/lib/brand/zenerating";
import { ProLockedOverlay } from "../ProLockedOverlay";
import { TeaserVisual, type TeaserIcon } from "./TeaserVisual";

export interface ComingSoonTeaserItem {
  phase: number;
  title: string;
  description: string;
  icon: TeaserIcon;
  accent: string;
}

interface ComingSoonTeaserProps {
  item: ComingSoonTeaserItem;
}

export function ComingSoonTeaser({ item }: ComingSoonTeaserProps) {
  return (
    <article className="crypto-card relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-surface-border/40 px-4 py-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white">{item.title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {item.description}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-surface-border/60 bg-surface/70 px-2 py-0.5 font-mono text-[10px] font-medium text-gray-400">
          {item.phase}
        </span>
      </div>

      <div
        className={`relative h-28 bg-gradient-to-br ${item.accent} sm:h-32`}
      >
        <div className="absolute inset-0 opacity-90">
          <TeaserVisual icon={item.icon} />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zen-deep/70 backdrop-blur-[3px]">
          <span className="rounded-full border border-zen-sage/30 bg-zen-sage/15 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zen-sage">
            Coming Soon
          </span>
          <span className="text-[10px] text-gray-500">Phase {item.phase}</span>
        </div>
      </div>
    </article>
  );
}

const TOKEN_COMING_SOON: ComingSoonTeaserItem[] = [
  {
    phase: 7,
    title: "Real-Time Alerts",
    description:
      "Get notified when mint authority activates, LP drops, or a top holder dumps.",
    icon: "alert",
    accent: "from-accent-red/30 to-accent-red/5",
  },
  {
    phase: 10,
    title: "AI Risk Summary",
    description:
      "Plain-English risk analysis powered by live on-chain context for this token.",
    icon: "ai",
    accent: "from-solana-green/30 to-solana-green/5",
  },
];

interface TokenComingSoonSectionsProps {
  isPro: boolean;
  onUpgrade: () => void;
}

export function TokenComingSoonSections({
  isPro,
  onUpgrade,
}: TokenComingSoonSectionsProps) {
  const content = (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zen-sage">
          {ZENERATING.name} Roadmap
        </p>
        <h3 className="mt-1 text-base font-semibold text-white">
          Upcoming intelligence
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          What&apos;s shipping next on {ZENERATING.name} — calm, clear modules
          tailored for this token.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {TOKEN_COMING_SOON.map((item) => (
          <ComingSoonTeaser key={item.phase} item={item} />
        ))}
      </div>
    </section>
  );

  if (!isPro) {
    return (
      <ProLockedOverlay
        onUpgrade={onUpgrade}
        title="Upcoming Pro modules"
        description="Alerts, watchlists, extension, and AI summaries require Pro."
      >
        {content}
      </ProLockedOverlay>
    );
  }

  return content;
}