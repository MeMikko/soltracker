import type { WalletDetails as WalletDetailsType } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import { DetailCard } from "./DetailCard";

interface WalletDetailsProps {
  data: WalletDetailsType;
}

export function WalletDetails({ data }: WalletDetailsProps) {
  return (
    <section>
      <h3 className="section-label mb-4">Wallet Details</h3>
      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <DetailCard label="Age" value={`${data.ageDays} days`} />
        <DetailCard
          label="SOL Balance"
          value={`${formatNumber(data.solBalance, 4)} SOL`}
          highlight={data.solBalance >= 1}
        />
        <DetailCard
          label="Token Count"
          value={formatNumber(data.tokenCount, 0)}
        />
        <DetailCard label="Tx Count" value={formatNumber(data.txCount, 0)} />
        <DetailCard label="First Tx" value={formatDate(data.firstTx)} />
        <DetailCard label="Last Tx" value={formatDate(data.lastTx)} />
      </div>
    </section>
  );
}