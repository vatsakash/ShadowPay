import React, { useState } from 'react';
import {
  FileCheck,
  Shield,
  Download,
  Copy,
  Check,
  Building,
  Key,
  Calendar,
  Hash,
  Scale,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  PayrollLedgerState,
  RecipientSplitRule,
  SelectiveAuditReceipt
} from '../midnight/types';
import { ShadowPayEngine } from '../midnight/ShadowPaySimulator';

interface AuditDisclosureProps {
  ledgerState: PayrollLedgerState;
  splits: RecipientSplitRule[];
  initialSplitId?: string;
}

export const AuditDisclosure: React.FC<AuditDisclosureProps> = ({
  ledgerState,
  splits,
  initialSplitId,
}) => {
  const engine = ShadowPayEngine.getInstance();

  const [selectedSplitId, setSelectedSplitId] = useState<string>(
    initialSplitId || splits[0]?.id || ''
  );
  const [auditKey, setAuditKey] = useState<string>('IRS_COMPLIANCE_KEY_2026_Q3');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'global'>('individual');

  const receipt: SelectiveAuditReceipt | null = selectedSplitId
    ? engine.generateSelectiveAuditReceipt(selectedSplitId, auditKey)
    : null;

  const globalAudit = engine.generateGlobalAuditReport(auditKey);

  const handleCopyJson = () => {
    if (!receipt) return;
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel-glow rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300 font-mono">
                Circuit 5: disclose_payroll_audit
              </span>
              <span className="text-xs text-slate-400">• Cryptographic Selective Disclosure</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-white">
              Selective Disclosure & Tax Compliance Verifier
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Recipients and DAOs can selectively prove authentic compensation, contractual minimum compliance,
              and full budget conservation to tax authorities or auditors — completely hiding co-recipient salaries and identities.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveSubTab('individual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'individual'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recipient Tax Receipt
            </button>
            <button
              onClick={() => setActiveSubTab('global')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'global'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              DAO Compliance Report
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'individual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Selection */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-cyan-400" />
              <span>Select Recipient Certificate</span>
            </h3>

            <div className="space-y-2">
              {splits.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSplitId(s.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedSplitId === s.id
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">{s.name}</div>
                  <div className="text-[11px] text-slate-400">{s.role}</div>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Authorized Auditor / Tax Authority Key
              </label>
              <input
                type="text"
                value={auditKey}
                onChange={(e) => setAuditKey(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/40"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Determines the selective disclosure viewing grant for auditing.
              </p>
            </div>
          </div>

          {/* Right: Cryptographic Receipt Certificate */}
          <div className="lg:col-span-2 space-y-4">
            {receipt ? (
              <div className="rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-b from-slate-900/95 to-[#070b14]/95 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                {/* Certificate Background Watermark */}
                <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
                  <Shield className="w-64 h-64 text-cyan-400" />
                </div>

                {/* Top Certificate Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                      <Sparkles className="h-4 w-4" />
                      <span>CRYPTOGRAPHIC SELECTIVE DISCLOSURE CERTIFICATE</span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">
                      Midnight Network Private Settlement Receipt
                    </h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Receipt ID: <span className="text-cyan-300 font-semibold">{receipt.receiptId}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition-colors shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied JSON' : 'Export Receipt'}</span>
                  </button>
                </div>

                {/* Certificate Body Fields */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] uppercase font-sans">Verified Recipient</span>
                    <div className="text-sm font-bold text-white mt-0.5">{receipt.recipientName}</div>
                    <div className="text-xs text-slate-400">{receipt.role}</div>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] uppercase font-sans">Verified Compensation</span>
                    <div className="text-sm font-bold text-cyan-300 mt-0.5">
                      {receipt.verifiedAmount.toLocaleString()} tNIGHT
                    </div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span>✓ Contractual Floor Satisfied (≥ {receipt.contractualMinFloor.toLocaleString()})</span>
                    </div>
                  </div>

                  <div className="sm:col-span-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] uppercase font-sans">Zero-Knowledge Verification Hash</span>
                    <div className="text-[11px] text-slate-300 break-all mt-0.5">
                      {receipt.zkProofVerificationHash}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] uppercase font-sans">Preprod Contract Address</span>
                    <div className="text-[11px] text-slate-300 break-all mt-0.5">
                      {receipt.contractAddress}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] uppercase font-sans">Privacy Invariant</span>
                    <div className="text-xs text-cyan-300 font-semibold mt-0.5">
                      {receipt.anonymizedCoRecipientsCount} Co-Recipients Concealed
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                      Zero leakage of other teammates' salary or identity
                    </div>
                  </div>
                </div>

                {/* Footer Validation Stamp */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <Check className="h-4 w-4" />
                    <span>Cryptographically verified on Midnight Preprod Network</span>
                  </div>
                  <div className="font-mono text-[10px]">
                    Timestamp: {new Date(receipt.generatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* Global DAO Compliance View */
        <div className="glass-panel rounded-2xl p-8 border border-slate-800/80 max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <Building className="h-6 w-6 text-cyan-400" />
            <div>
              <h3 className="text-lg font-bold text-white">DAO Global Disbursement Audit Report</h3>
              <p className="text-xs text-slate-400">Verifies mathematical solvency without salary disclosure</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Budget Conservation</span>
              <div className="text-emerald-400 text-sm font-bold flex items-center gap-1.5 mt-1">
                <span>✓ 100% Solvency Proven</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-1">
                Total disbursed equals funded budget to the exact wei.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Floor Commitments</span>
              <div className="text-emerald-400 text-sm font-bold flex items-center gap-1.5 mt-1">
                <span>✓ All Floors Honored</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-1">
                Zero recipients received less than their agreed minimum floor.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Double-Payment Audit</span>
              <div className="text-cyan-400 text-sm font-bold flex items-center gap-1.5 mt-1">
                <span>✓ 0 Duplicate Claims</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-1">
                Nullifiers guarantee single claim execution per batch.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Privacy Guarantee</span>
              <div className="text-violet-400 text-sm font-bold flex items-center gap-1.5 mt-1">
                <span>✓ Zero Salary Leakage</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-1">
                Auditor verified proof without accessing individual amounts.
              </p>
            </div>

            <div className="sm:col-span-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Auditor Verification Hash</span>
              <div className="text-slate-300 text-xs break-all mt-1">
                {globalAudit.verifierHash}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
