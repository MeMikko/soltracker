import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import {
  memoryGetFeaturedTokenSetting,
  memorySetFeaturedTokenSetting,
} from "@/lib/dev/memory-store";
import { FEATURED_TOKEN_MINT } from "@/lib/featured-token";
import { getGmgnTradeUrl } from "@/lib/gmgn";
import type { FeaturedTokenAdminSetting, FeaturedTokenPublic } from "@/lib/types";

const SETTING_ID = 1;

const DEFAULT_SETTING: FeaturedTokenAdminSetting = {
  enabled: true,
  mint: FEATURED_TOKEN_MINT,
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};

function normalizeMint(mint: string | null | undefined): string | null {
  const trimmed = mint?.trim();
  return trimmed ? trimmed : null;
}

function toPublicSetting(
  setting: FeaturedTokenAdminSetting
): FeaturedTokenPublic {
  const mint = setting.enabled ? normalizeMint(setting.mint) : null;

  return {
    enabled: Boolean(setting.enabled && mint),
    mint,
    href: mint ? getGmgnTradeUrl(mint) : null,
    updatedAt: setting.updatedAt,
  };
}

async function readSettingFromDb(): Promise<FeaturedTokenAdminSetting | null> {
  const row = await prisma.featuredTokenSetting.findUnique({
    where: { id: SETTING_ID },
  });

  if (!row) return null;

  return {
    enabled: row.enabled,
    mint: row.mint,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

async function writeSettingToDb(
  input: FeaturedTokenAdminSetting
): Promise<FeaturedTokenAdminSetting> {
  const row = await prisma.featuredTokenSetting.upsert({
    where: { id: SETTING_ID },
    create: {
      id: SETTING_ID,
      mint: input.mint,
      enabled: input.enabled,
      updatedBy: input.updatedBy,
    },
    update: {
      mint: input.mint,
      enabled: input.enabled,
      updatedBy: input.updatedBy,
    },
  });

  return {
    enabled: row.enabled,
    mint: row.mint,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

export async function getFeaturedTokenAdminSetting(): Promise<FeaturedTokenAdminSetting> {
  if (!hasDatabase()) {
    return memoryGetFeaturedTokenSetting();
  }

  const row = await withDbFallback(
    () => readSettingFromDb(),
    null,
    "featured token setting read"
  );

  return row ?? DEFAULT_SETTING;
}

export async function getFeaturedTokenPublicSetting(): Promise<FeaturedTokenPublic> {
  const setting = await getFeaturedTokenAdminSetting();
  return toPublicSetting(setting);
}

export async function updateFeaturedTokenAdminSetting(
  wallet: string,
  input: { mint?: string; enabled: boolean }
): Promise<FeaturedTokenAdminSetting> {
  const current = await getFeaturedTokenAdminSetting();
  const mint =
    input.mint !== undefined
      ? normalizeMint(input.mint)
      : normalizeMint(current.mint);

  const next: FeaturedTokenAdminSetting = {
    enabled: input.enabled,
    mint: input.enabled ? mint ?? FEATURED_TOKEN_MINT : mint,
    updatedAt: new Date().toISOString(),
    updatedBy: wallet,
  };

  if (!hasDatabase()) {
    memorySetFeaturedTokenSetting(next);
    return next;
  }

  return withDbFallback(
    () => writeSettingToDb(next),
    next,
    "featured token setting write"
  );
}