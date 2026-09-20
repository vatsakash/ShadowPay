import React from 'react';
import {
  Eye,
  ExternalLink,
  ShieldCheck,
  Hash,
  Coins,
  CheckCircle2,
  Copy,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { PayrollLedgerState, RecipientSplitRule } from '../midnight/types';

interface PublicTransparencyExplorerProps {
  ledgerState: PayrollLedgerState;
  splits: RecipientSplitRule[];
}

export const PublicTransparencyExplorer: React.FC<PublicTransparencyExplorerProps> = ({
  ledgerState,
  splits,
}) => {
  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(key);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Contract Verification Banner */}
      <div className="glass-panel-glow rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 font-mono">
                Midnight Preprod Network
              </span>
              <span className="text-xs text-slate-400">• Compact v0.23 Verifiable Contract</span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-black text-white">
              Public On-Chain Verification Ledger
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Anyone can audit that total disbursements match funded deposits and all contractual constraints hold,
              while individual allocations, recipient identities, and wallet addresses remain shielded.
            </p>
          </div>

          <a
            href={`https://preprod.midnightexplorer.com/contracts/${ledgerState.contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all shrink-0"
          >
            <span>View on Midnight Explorer</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Address Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-sans text-[11px]">
              <span className="font-semibold text-slate-300">Explorer Hex Contract Address</span>
              <button
                onClick={() => handleCopy(ledgerState.contractAddress, 'hex')}
                className="text-cyan-400 hover:text-cyan-300"
              >
                {copiedAddress === 'hex' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="text-slate-200 text-xs break-all font-semibold">
              {ledgerState.contractAddress}
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              Format used for direct lookup on preprod.midnightexplorer.com
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-sans text-[11px]">
              <span className="font-semibold text-slate-300">Bech32m Contract Address</span>
              <button
                onClick={() => handleCopy(ledgerState.preprodBech32m, 'bech32m')}
                className="text-cyan-400 hover:text-cyan-300"
              >
                {copiedAddress === 'bech32m' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="text-slate-200 text-xs break-all font-semibold">
              {ledgerState.preprodBech32m}
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              Bech32m standard format for Rise In challenge submission and SDK
            </div>
          </div>
        </div>
      </div>

      {/* Public State Table & Shielded Leaves */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Public Blockchain State vs Private Shielded Inputs</span>
            </h3>
            <p className="text-xs text-slate-400">
              Comparing what external observers see versus what remains private to recipients
            </p>
          </div>

          <div className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-[11px] font-mono text-cyan-300">
            Batch Hash: {ledgerState.batchHash.substring(0, 10)}...
          </div>
        </div>

        {/* Ledger State Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] font-sans">Public Escrow Budget</span>
            <div className="text-sm font-bold text-cyan-300 mt-0.5">
              {ledgerState.totalFundedBudget.toLocaleString()} tNIGHT
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] font-sans">Proven Disbursed Sum</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              {ledgerState.totalAllocatedAmount.toLocaleString()} tNIGHT
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] font-sans">Shielded Leaves</span>
            <div className="text-sm font-bold text-white mt-0.5">
              {ledgerState.recipientCount} Recipients
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] font-sans">Settlement Status</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              {ledgerState.isSettled ? 'Finalized (ZK Proven)' : 'Pending Settlement'}
            </div>
          </div>
        </div>

        {/* Public Observer View: Simulated Explorer Table */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slate-300 mb-3">
            Public Observer View (How transactions appear on Midnight Preprod Explorer)
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Leaf Index</th>
                  <th className="py-2.5 px-3">On-Chain Commitment Hash</th>
                  <th className="py-2.5 px-3">Recipient Identity</th>
                  <th className="py-2.5 px-3">Disbursed Amount</th>
                  <th className="py-2.5 px-3">ZK Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                {splits.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-900/70">
                    <td className="py-3 px-3 text-slate-400 font-bold">#{idx + 1}</td>
                    <td className="py-3 px-3 text-cyan-300">
                      {s.commitmentHash.substring(0, 18)}...
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
                        <Lock className="h-3 w-3 text-cyan-400" />
                        <span>Shielded Witness</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="shielded-blur font-bold text-slate-300">
                        {s.salaryAmount.toLocaleString()} tNIGHT
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Floor & Sum Proven</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
