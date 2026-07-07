import type { TokenDetails as TokenDetailsType } from "@/lib/types";
import { formatNumber, formatSupply, truncateAddress } from "@/lib/format";
import { DetailCard } from "./DetailCard";
import { TokenComingSoonSections } from "./teasers/ComingSoonTeaser";

interface TokenDetailsProps {
  data: TokenDetailsType;
}

export function TokenDetails({ data }: TokenDetailsProps) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="section-label mb-4">Token Details</h3>
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          <DetailCard
            label="Supply"
            value={formatSupply(data.supply, data.decimals)}
          />
          <DetailCard
            label="Creator"
            value={data.creator ? truncateAddress(data.creator, 6) : "—"}
            mono
          />
          <DetailCard
            label="Holder Count"
            value={formatNumber(data.holderCount, 0)}
          />
          <DetailCard
            label="Mint Authority"
            value={data.mintAuthorityRevoked ? "Revoked" : "Active"}
            highlight={data.mintAuthorityRevoked}
          />
          <DetailCard
            label="Freeze Authority"
            value={data.freezeAuthorityRevoked ? "Revoked" : "Active"}
            highlight={data.freezeAuthorityRevoked}
          />
          <DetailCard
            label="Liquidity Pool"
            value={
              data.lp.hasLp
                ? `${data.lp.dex ?? "DEX"} · $${formatNumber(data.lp.liquidityUsd ?? 0, 0)}`
                : "None detected"
            }
            highlight={data.lp.hasLp}
          />
          {data.lp.poolAddress && (
            <DetailCard
              label="Pool Address"
              value={truncateAddress(data.lp.poolAddress, 6)}
              mono
            />
          )}
        </div>
      </section>

      <TokenComingSoonSections />
    </div>
  );
}