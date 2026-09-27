import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Coins,
  ArrowRight,
  Hash,
  Sparkles,
  RefreshCw,
  Scale,
  Wallet
} from 'lucide-react';
import {
  PayrollLedgerState,
  RecipientSplitRule,
  ZKProofLog
} from '../midnight/types';
import { ShadowPayEngine } from '../midnight/ShadowPaySimulator';
import { MidnightDAppConnector, MidnightWalletState } from '../midnight/dappConnector';

interface AdminPayrollProps {
  ledgerState: PayrollLedgerState;
  splits: RecipientSplitRule[];
  onRefresh: () => void;
  onProofGenerated: (proof: ZKProofLog) => void;
}

export const AdminPayroll: React.FC<AdminPayrollProps> = ({
  ledgerState,
  splits,
  onRefresh,
  onProofGenerated,
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

  // Local form state for new split
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [address, setAddress] = useState('');
  const [salary, setSalary] = useState('');
  const [minFloor, setMinFloor] = useState('');

  // Deposit budget state
  const [depositAmount, setDepositAmount] = useState('50000');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isAddingSplit, setIsAddingSplit] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Privacy toggle: Blur / Shield confidential amounts
  const [isShieldedMode, setIsShieldedMode] = useState(true);

  // Quick preset contributor
  const handleApplyPreset = (presetName: string, presetRole: string, defaultSalary: number, defaultFloor: number) => {
    setName(presetName);
    setRole(presetRole);
    setAddress(`mn_addr_preprod1q${Math.random().toString(36).substring(2, 10)}`);
    setSalary(defaultSalary.toString());
    setMinFloor(defaultFloor.toString());
  };

  // Deposit budget handler through 1AM
  const handleDepositBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDepositing(true);

    try {
      const budgetBigInt = BigInt(depositAmount);
      if (budgetBigInt <= 0n) {
        throw new Error('Deposit budget must be greater than zero');
      }

      // Ensure 1AM connection before transaction
      if (!connector.getState().isConnected) {
        await connector.connect();
      }

      // Balance & submit transaction through 1AM extension (triggers approval popup)
      const txPayload = `0x01${budgetBigInt.toString(16).padStart(16, '0')}`;
      let txHash: string | undefined;
      let used1AM = false;

      try {
        const txResult = await connector.executeOnChainTransaction(txPayload);
        txHash = txResult.txHash;
        used1AM = txResult.via1AM;
      } catch (walletErr: any) {
        throw new Error(walletErr?.message || 'Transaction was rejected in 1AM wallet');
      }

      const adminAddress = connector.getState().address || ledgerState.adminPk;
      const proof = await engine.depositPayrollBudget(adminAddress, budgetBigInt, txHash);
      onProofGenerated(proof);

      setSuccessMessage(
        used1AM
          ? `Successfully funded escrow with ${depositAmount} tNIGHT via 1AM Preprod! (Tx: ${txHash.slice(0, 18)}...)`
          : `Successfully funded escrow with ${depositAmount} tNIGHT on Midnight Preprod! (Tx: ${proof.txHash.slice(0, 18)}...)`
      );
      onRefresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to deposit budget');
    } finally {
      setIsDepositing(false);
    }
  };

  // Add split handler
  const handleAddSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAddingSplit(true);

    try {
      if (!name || !role || !address || !salary || !minFloor) {
        throw new Error('Please fill in all recipient split fields');
      }

      const salaryBigInt = BigInt(salary);
      const minFloorBigInt = BigInt(minFloor);

      const result = await engine.commitRecipientSplit(
        name,
        role,
        address,
        salaryBigInt,
        minFloorBigInt
      );

      onProofGenerated(result.proofLog);
      setSuccessMessage(`Committed private split for ${name} with ZK minimum guarantee verified!`);
      setName('');
      setRole('');
      setAddress('');
      setSalary('');
      setMinFloor('');
      onRefresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to commit split');
    } finally {
      setIsAddingSplit(false);
    }
  };

  // Finalize settlement batch through 1AM
  const handleFinalizeBatch = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsFinalizing(true);

    try {
      // Ensure 1AM connection before batch settlement transaction
      if (!connector.getState().isConnected) {
        await connector.connect();
      }

      const txPayload = `0x03${ledgerState.batchHash.slice(2)}`;
      let txHash: string | undefined;
      let used1AM = false;

      try {
        const txResult = await connector.executeOnChainTransaction(txPayload);
        txHash = txResult.txHash;
        used1AM = txResult.via1AM;
      } catch (walletErr: any) {
        throw new Error(walletErr?.message || 'Finalization batch transaction rejected in 1AM');
      }

      const proof = await engine.finalizeSettlementBatch(txHash);
      onProofGenerated(proof);

      setSuccessMessage(
        used1AM
          ? `ZK Proof generated and settlement batch confirmed via 1AM Preprod! (Tx: ${txHash.slice(0, 18)}...)`
          : 'ZK Proof generated! Settlement batch finalized and verified on Midnight Preprod.'
      );
      onRefresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to finalize batch');
    } finally {
      setIsFinalizing(false);
    }
  };

  const remainingBudget = ledgerState.totalFundedBudget - ledgerState.totalAllocatedAmount;
  const isExactMatch = ledgerState.totalAllocatedAmount === ledgerState.totalFundedBudget && ledgerState.totalFundedBudget > 0n;

  return (
    <div className="space-y-6">
      {/* 1AM Wallet Connection Status Banner */}
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
                <strong>1AM Extension Connected (Preprod)</strong>: All transactions will trigger hardware/extension approval popup in 1AM.
              </span>
            </>
          ) : walletState.isInstalled ? (
            <>
              <Wallet className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>
                <strong>1AM Extension Ready</strong>: Connect to sign and balance transactions natively with your 1AM wallet.
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
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Funded Budget */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Escrow Funded Budget
            </span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {ledgerState.totalFundedBudget.toLocaleString()}
            </span>
            <span className="ml-1.5 text-xs font-semibold text-cyan-400 font-mono">tNIGHT</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Public commitment on Midnight ledger</p>
        </div>

        {/* Total Allocated */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cumulative Private Splits
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {ledgerState.totalAllocatedAmount.toLocaleString()}
            </span>
            <span className="ml-1.5 text-xs font-semibold text-emerald-400 font-mono">tNIGHT</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            {isExactMatch ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Exact 100% Budget Match (ZK Proven)
              </span>
            ) : (
              <span className="text-amber-400 font-medium font-mono">
                {remainingBudget > 0n ? `${remainingBudget.toLocaleString()} tNIGHT remaining` : 'Exceeds budget!'}
              </span>
            )}
          </div>
        </div>

        {/* Recipients Count */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Shielded Recipients
            </span>
            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400 border border-violet-500/20">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {ledgerState.recipientCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({ledgerState.claimsCount} claimed)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Commitments hashed in zk-tree</p>
        </div>

        {/* Settlement Status */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Settlement Status
            </span>
            <div className={`rounded-lg p-2 border ${
              ledgerState.isSettled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <Lock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              ledgerState.isSettled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {ledgerState.isSettled ? 'Finalized & Proven' : 'Drafting Splits'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {ledgerState.isSettled ? 'Ready for recipient claims' : 'Awaiting batch finalization'}
          </p>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1 font-mono text-xs">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1 font-medium text-xs">{successMessage}</div>
        </div>
      )}

      {/* Action Sections Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col: Escrow Deposit & Finalization */}
        <div className="space-y-6 lg:col-span-1">
          {/* 1. Fund Escrow Box */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">1. Fund Escrow Budget</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                deposit_payroll_budget
              </span>
            </div>

            <form onSubmit={handleDepositBudget} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Budget Amount (tNIGHT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-sm text-white font-mono focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    disabled={isDepositing}
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-500">
                    tNIGHT
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isDepositing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
              >
                {isDepositing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Signing & Balancing via 1AM (~6s)...</span>
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4" />
                    <span>Deposit & Open New Batch (via 1AM)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 2. Finalize & Prove Batch */}
          <div className="glass-panel-glow rounded-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">3. Finalize & Verify Proof</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                finalize_settlement_batch
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60 font-mono">
                <span className="text-slate-400">Escrow Budget:</span>
                <span className="text-white font-bold">{ledgerState.totalFundedBudget.toLocaleString()} tNIGHT</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60 font-mono">
                <span className="text-slate-400">Sum of Splits:</span>
                <span className="text-emerald-400 font-bold">{ledgerState.totalAllocatedAmount.toLocaleString()} tNIGHT</span>
              </div>
              <div className="flex items-center justify-between py-1.5 font-mono">
                <span className="text-slate-400">Constraint: sum == budget:</span>
                <span className={isExactMatch ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {isExactMatch ? 'Satisfied (100%)' : 'Mismatch'}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalizeBatch}
              disabled={isFinalizing || ledgerState.isSettled || !isExactMatch}
              className={`mt-5 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                ledgerState.isSettled
                  ? 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
                  : isExactMatch
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {isFinalizing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Proving & Signing via 1AM (~6s)...</span>
                </>
              ) : ledgerState.isSettled ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Settlement Batch Finalized</span>
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4" />
                  <span>Prove & Lock Settlement (via 1AM)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Col: Add Split & Allocations Table */}
        <div className="space-y-6 lg:col-span-2">
          {/* Add Split Form */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">2. Commit Private Split Rule</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                commit_recipient_split
              </span>
            </div>

            {/* Presets */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Quick Templates:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('David Thorne', 'DevOps & Infra', 8000, 6000)}
                className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40"
              >
                DevOps (8K)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Sarah Chen', 'Product Designer', 7000, 5000)}
                className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40"
              >
                Designer (7K)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Kiran Patel', 'Smart Contract Auditor', 10000, 8000)}
                className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40"
              >
                Auditor (10K)
              </button>
            </div>

            <form onSubmit={handleAddSplit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient Name / Pseudonym
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs text-white focus:border-cyan-500/50 focus:outline-none"
                  disabled={isAddingSplit || ledgerState.isSettled}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contributor Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Lead ZK Cryptographer"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs text-white focus:border-cyan-500/50 focus:outline-none"
                  disabled={isAddingSplit || ledgerState.isSettled}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Midnight Preprod Wallet Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="mn_addr_preprod1q..."
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300 focus:border-cyan-500/50 focus:outline-none"
                  disabled={isAddingSplit || ledgerState.isSettled}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confidential Salary Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 18000"
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500/50 focus:outline-none"
                    disabled={isAddingSplit || ledgerState.isSettled}
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-500">
                    tNIGHT
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contractual Minimum Floor Guarantee
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={minFloor}
                    onChange={(e) => setMinFloor(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs font-mono text-emerald-300 focus:border-cyan-500/50 focus:outline-none"
                    disabled={isAddingSplit || ledgerState.isSettled}
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-500">
                    floor
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={isAddingSplit || ledgerState.isSettled}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
                >
                  {isAddingSplit ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Generating Commitment & Proving Floor...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Commit Shielded Split to Batch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Shielded Allocations List */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="font-bold text-sm text-white">Shielded Contributor Registry</h3>
                <p className="text-xs text-slate-400">
                  ZK commitments stored on-chain; individual figures shielded from public view
                </p>
              </div>

              {/* Master Shielded Toggle */}
              <button
                onClick={() => setIsShieldedMode(!isShieldedMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  isShieldedMode
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {isShieldedMode ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Shielded Mode: Active</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-amber-400" />
                    <span>Admin Revealed Mode</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-800/60 overflow-hidden">
              {splits.map((s, idx) => (
                <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{s.name}</span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                          {s.role}
                        </span>
                        {s.isClaimed && (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            Claimed
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs font-mono text-slate-400">
                        <span>Addr: {s.recipientAddress.substring(0, 14)}...</span>
                        <span>•</span>
                        <span className="text-[11px] text-slate-500">
                          Nullifier: {s.nullifier.substring(0, 10)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <div className="text-xs text-slate-400">Allocated Split</div>
                      <div className={`font-mono font-bold text-sm ${isShieldedMode ? 'shielded-blur' : 'text-cyan-300'}`}>
                        {s.salaryAmount.toLocaleString()} tNIGHT
                      </div>
                    </div>

                    <div className="border-l border-slate-800 pl-3">
                      <div className="text-[10px] text-slate-400">Floor Guarantee</div>
                      <div className="flex items-center gap-1 font-mono text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>≥ {s.minCommittedFloor.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
