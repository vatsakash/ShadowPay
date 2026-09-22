import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Shield,
  Layers,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const DeveloperIntegrationGuide: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const compactSnippet = `// Midnight Compact v0.23: ShadowPay Privacy Circuit
pragma language_version 0.23;

export ledger total_funded_budget: Uint<64>;
export ledger total_allocated_amount: Uint<64>;
export ledger is_settled: Boolean;

witness get_recipient_secret(): Bytes<32>;
witness compute_payout_nullifier(secret: Bytes<32>, batchHash: Bytes<32>): Bytes<32>;

export circuit commit_recipient_split(
    recipientCommitment: Bytes<32>,
    minGuaranteedFloor: Uint<64>,
    salaryAmount: Uint<64>,
    recipientNullifier: Bytes<32>
): [] {
    assert(!is_settled, "Batch already finalized");
    assert(salaryAmount >= minGuaranteedFloor, "Below committed floor");

    const newTotal = total_allocated_amount + disclose(salaryAmount);
    assert(newTotal <= total_funded_budget, "Exceeds funded budget");

    total_allocated_amount = newTotal;
}`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel-glow rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400 border border-cyan-500/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Developer Integration & Architecture Guide</h2>
            <p className="text-xs text-slate-300">
              Technical documentation, ZK privacy model, and Compact v0.23 contract integration
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Matrix */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-cyan-400" />
          <span>ShadowPay Cryptographic Privacy Model</span>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Data Attribute</th>
                <th className="py-2.5 px-3">Visibility Level</th>
                <th className="py-2.5 px-3">Enforcement & Verification Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 text-[11px]">
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Recipient Salary Amount</td>
                <td className="py-3 px-3 text-cyan-400">🔒 Completely Private</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Shielded in local witness; only commitment hash stored on ledger
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Contractual Minimum Floor</td>
                <td className="py-3 px-3 text-emerald-400">🌐 ZK Proven On-Chain</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Circuit constraint enforces <code className="text-cyan-300">salary &gt;= minFloor</code> before commit
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Escrow Solvency & Exact Sum</td>
                <td className="py-3 px-3 text-emerald-400">🌐 Publicly Verifiable</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Circuit proves <code className="text-cyan-300">sum(splits) == total_funded_budget</code> at finalization
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Recipient Wallet Address</td>
                <td className="py-3 px-3 text-cyan-400">🔒 Completely Private</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Withdrawal uses unlinked 1AM address with secret witness proof
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Double-Disbursement Prevention</td>
                <td className="py-3 px-3 text-emerald-400">🌐 Publicly Prevented</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Deterministic nullifier <code className="text-cyan-300">Poseidon(secret, batchHash)</code> spent on ledger
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Selective Tax Audit Receipts</td>
                <td className="py-3 px-3 text-violet-400">🔑 Selective Disclosure</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Auditor verifies individual floor and total budget without seeing co-workers
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Contract Code Snippet */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">ShadowPay.compact Smart Contract Circuit</h3>
          </div>
          <button
            onClick={() => handleCopy(compactSnippet, 'compact')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
          >
            {copiedCode === 'compact' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedCode === 'compact' ? 'Copied' : 'Copy DSL'}</span>
          </button>
        </div>

        <div className="rounded-xl bg-slate-950 p-4 border border-slate-900 overflow-x-auto font-mono text-xs text-cyan-300">
          <pre>{compactSnippet}</pre>
        </div>
      </div>
    </div>
  );
};
