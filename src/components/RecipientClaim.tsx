import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ShieldCheck,
  Lock,
  Key,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Coins,
  ShieldAlert
} from 'lucide-react';
import {
  PayrollLedgerState,
  RecipientSplitRule,
  ZKProofLog
} from '../midnight/types';
import { ShadowPayEngine } from '../midnight/ShadowPaySimulator';
import { MidnightDAppConnector, MidnightWalletState } from '../midnight/dappConnector';

interface RecipientClaimProps {
  ledgerState: PayrollLedgerState;
  splits: RecipientSplitRule[];
  onRefresh: () => void;
  onProofGenerated: (proof: ZKProofLog) => void;
  onSelectReceipt: (splitId: string) => void;
}

export const RecipientClaim: React.FC<RecipientClaimProps> = ({
  ledgerState,
  splits,
  onRefresh,
  onProofGenerated,
  onSelectReceipt,
}) => {
  const engine = ShadowPayEngine.getInstance();
  const connector = MidnightDAppConnector.getInstance();
  const [walletState, setWalletState] = useState<MidnightWalletState>(connector.getState());

  useEffect(() => {
    const unsub = connector.subscribe((state) => {
      setWalletState(state);
    });
    return unsub;
  }, [connector]);

  const [selectedSplitId, setSelectedSplitId] = useState<string>(splits[0]?.id || '');
  const [customSecret, setCustomSecret] = useState<string>('');
  const [useCustomSecret, setUseCustomSecret] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedSplit = splits.find((s) => s.id === selectedSplitId);

  const handleClaimPayout = async () => {
    if (!selectedSplit) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsClaiming(true);

    try {
      // Ensure 1AM wallet connection
      if (!connector.getState().isConnected) {
        await connector.connect();
      }

      const secretToUse = useCustomSecret ? customSecret : selectedSplit.secretKey;
      const txPayload = `0x04${selectedSplit.nullifier.slice(2)}`;
      let txHash: string | undefined;
      let used1AM = false;

      try {
        const txResult = await connector.executeOnChainTransaction(txPayload);
        txHash = txResult.txHash;
        used1AM = txResult.via1AM;
      } catch (walletErr: any) {
        throw new Error(walletErr?.message || 'Claim transaction rejected in 1AM wallet');
      }

      const proof = await engine.claimPrivatePayout(selectedSplit.id, secretToUse, txHash);

      onProofGenerated(proof);
      setSuccessMessage(
        used1AM
          ? `Confidential payout unlocked and confirmed via 1AM Preprod! ${selectedSplit.salaryAmount.toLocaleString()} tNIGHT claimed to your wallet. (Tx: ${txHash.slice(0, 18)}...)`
          : `Confidential payout unlocked! ${selectedSplit.salaryAmount.toLocaleString()} tNIGHT claimed to your wallet.`
      );
      onRefresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Claim failed');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="glass-panel-glow rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 font-mono">
                Circuit 4: claim_private_payout
              </span>
              <span className="text-xs text-slate-400">• Anti-Double Claim Nullifiers</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-white">
              Recipient Confidential Claim & Entitlement Portal
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Verify and withdraw your private salary or revenue-split using client-side zero-knowledge witness proofs.
              Your public address and compensation amount are never disclosed to co-workers or the public ledger.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-slate-800 p-3">
            <Lock className="h-5 w-5 text-cyan-400 shrink-0" />
            <div className="text-xs">
              <div className="font-semibold text-white">Zero-Knowledge Protected</div>
              <div className="text-slate-400 text-[11px]">Local proof on your device</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1AM Wallet Status Banner */}
      <div className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        walletState.isReal1AM
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : walletState.isInstalled
          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex items-center gap-2">
          {walletState.isReal1AM ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                <strong>1AM Extension Connected (Preprod)</strong>: Claim transactions will prompt hardware/extension approval popup in 1AM.
              </span>
            </>
          ) : walletState.isInstalled ? (
            <>
              <Wallet className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>
                <strong>1AM Extension Ready</strong>: Connect to sign and balance confidential claims via 1AM.
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>1AM Extension Not Detected</strong>: Running in interactive Preprod simulation mode. Install <a href="https://1am.xyz" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-white">1AM Extension</a> for live browser signing.
              </span>
            </>
          )}
        </div>

        {!walletState.isConnected && (
          <button
            type="button"
            onClick={() => connector.connect()}
            className="self-start sm:self-auto rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-all shrink-0"
          >
            Connect 1AM
          </button>
        )}
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-300 font-mono">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1 font-semibold">{successMessage}</div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Contributor Selection */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Wallet className="h-4 w-4 text-cyan-400" />
            <span>Select Your Contributor Leaf</span>
          </h3>

          <div className="space-y-2.5">
            {splits.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSplitId(s.id);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedSplitId === s.id
                    ? 'bg-cyan-500/15 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">{s.name}</span>
                  {s.isClaimed ? (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      Claimed
                    </span>
                  ) : (
                    <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                      Unclaimed
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">{s.role}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Floor: ≥ {s.minCommittedFloor.toLocaleString()}</span>
                  <span className="text-cyan-400 font-semibold">{s.salaryAmount.toLocaleString()} tNIGHT</span>
                </div>
              </button>
            ))}
          </div>

          {/* Custom Witness Key Toggle (for testing rejection / verification) */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setUseCustomSecret(!useCustomSecret)}
              className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
            >
              <Key className="h-3 w-3" />
              <span>{useCustomSecret ? 'Use Contributor Secret' : 'Test with Manual / Invalid Secret Key'}</span>
            </button>

            {useCustomSecret && (
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customSecret}
                  onChange={(e) => setCustomSecret(e.target.value)}
                  placeholder="0xsec_..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/40"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Enter an invalid key to test zero-knowledge circuit constraint rejection.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Claim Terminal & Selective Disclosure Trigger */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSplit ? (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div>
                  <span className="text-xs font-mono text-cyan-400">{selectedSplit.role}</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{selectedSplit.name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-right font-mono">
                    <div className="text-[10px] text-slate-400">Shielded Amount</div>
                    <div className="text-sm font-bold text-cyan-300">
                      {selectedSplit.salaryAmount.toLocaleString()} tNIGHT
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic Entitlement Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-3.5 space-y-2">
                  <div className="text-slate-400 text-[11px] font-sans font-semibold">1. Contractual Minimum Guarantee</div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>≥ {selectedSplit.minCommittedFloor.toLocaleString()} tNIGHT Satisfied</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    ZK circuit verified: actual payout exceeds the contractual minimum floor agreed upon.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-3.5 space-y-2">
                  <div className="text-slate-400 text-[11px] font-sans font-semibold">2. Anti-Double Claim Protection</div>
                  <div className="flex items-center gap-2 text-cyan-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Deterministic Nullifier</span>
                  </div>
                  <div className="text-[10px] text-slate-500 break-all">
                    {selectedSplit.nullifier}
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-xl bg-slate-900/80 border border-slate-800/80 p-3.5 space-y-2">
                  <div className="text-slate-400 text-[11px] font-sans font-semibold">3. Shielded Commitment Hash (on Ledger)</div>
                  <div className="text-[11px] text-slate-300 break-all">
                    {selectedSplit.commitmentHash}
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Hashed with private secret witness. Public observers can verify inclusion without reading the salary.
                  </p>
                </div>
              </div>

              {/* Claim Action */}
              <div className="pt-2">
                {!ledgerState.isSettled ? (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-300">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>
                      Disbursement batch is currently in draft. The admin must finalize and prove the batch before payouts can be claimed.
                    </span>
                  </div>
                ) : selectedSplit.isClaimed ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>
                        Payout successfully claimed on Midnight Preprod! Nullifier recorded in spent set.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectReceipt(selectedSplit.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
                    >
                      <FileCheck className="h-4 w-4" />
                      <span>Generate Selective Disclosure Tax & Audit Receipt</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleClaimPayout}
                    disabled={isClaiming}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
                  >
                    {isClaiming ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Signing & Claiming via 1AM (~6s)...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4" />
                        <span>Claim Private Payout (via 1AM - {selectedSplit.salaryAmount.toLocaleString()} tNIGHT)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-10 text-center text-slate-400">
              Select a contributor from the left panel to inspect and claim.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
