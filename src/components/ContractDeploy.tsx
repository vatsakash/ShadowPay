import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Shield,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Copy,
  Radio,
  Cpu,
  FileCode,
  Sparkles,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { BrowserDeployer, DeploymentStepLog } from '../midnight/browserDeployer';
import { ContractDeploymentInfo, PayrollLedgerState } from '../midnight/types';
import { detectWallet, setNetworkId, getNetworkId } from '../midnight/midnight1am';

interface ContractDeployProps {
  ledgerState: PayrollLedgerState;
  onDeploymentSuccess: () => void;
}

export const ContractDeploy: React.FC<ContractDeployProps> = ({
  ledgerState,
  onDeploymentSuccess,
}) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStepLog[]>([]);
  const [deploymentResult, setDeploymentResult] = useState<ContractDeploymentInfo | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [walletDetected, setWalletDetected] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Explicitly set network ID before any wallet or contract operation
    setNetworkId('preprod');

    // Detect 1AM wallet in window
    detectWallet().then((w) => setWalletDetected(w !== null));
  }, []);

  const handleStartDeployment = async () => {
    setIsDeploying(true);
    setDeploymentResult(null);
    setErrorMessage(null);

    try {
      // Explicitly enforce preprod network ID before starting deploy flow
      setNetworkId('preprod');

      const result = await BrowserDeployer.deployToPreprod((steps) => {
        setDeploymentSteps(steps);
      });

      setDeploymentResult(result);
      onDeploymentSuccess();
    } catch (err: unknown) {
      console.error('Deployment error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Contract deployment encountered an issue');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Route Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="text-cyan-400 font-bold">Route:</span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
            /deploy
          </span>
          <span>•</span>
          <span>Browser Extension Deploy Flow</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Network ID:</span>
          <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-cyan-300 font-semibold uppercase">
            {getNetworkId()}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="glass-panel-glow rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400 border border-cyan-500/30">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">1AM Browser Extension Preprod Deployer</h2>
              <p className="text-xs text-slate-300">
                Deploy <code className="text-cyan-300 font-mono">ShadowPay.compact</code> natively through your 1AM wallet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {walletDetected ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>1AM Extension Ready</span>
              </span>
            ) : (
              <a
                href="https://1am.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-cyan-300 transition-colors"
              >
                <Wallet className="h-4 w-4 text-cyan-400" />
                <span>Get 1AM Wallet</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Deploy Highlights */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
            <Radio className="h-4 w-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-slate-300 font-semibold">Preprod Network</div>
              <div className="text-[10px] text-slate-500">Explicit networkId: preprod</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
            <Cpu className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-slate-300 font-semibold">Zero Gas / No Proof Server</div>
              <div className="text-[10px] text-slate-500">1AM ProofStation proving</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
            <FileCode className="h-4 w-4 text-violet-400 shrink-0" />
            <div>
              <div className="text-slate-300 font-semibold">No Server Wallet</div>
              <div className="text-[10px] text-slate-500">100% Client-side signed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error notification if any */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-300 font-mono">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Main Deploy Box */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-white">Deploy to Midnight Preprod</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates unproven deploy tx, proves and balances via 1AM ProofStation, broadcasts to Preprod RPC, and polls the indexer.
            </p>
          </div>

          <button
            onClick={handleStartDeployment}
            disabled={isDeploying}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 shrink-0"
          >
            {isDeploying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Deploying via 1AM Preprod...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Deploy Contract Now</span>
              </>
            )}
          </button>
        </div>

        {/* Step-by-Step Progress */}
        {deploymentSteps.length > 0 && (
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-5 space-y-3 font-mono text-xs">
            <div className="text-slate-400 font-sans font-semibold text-xs mb-2">1AM Deployment Pipeline:</div>
            {deploymentSteps.map((step) => (
              <div key={step.step} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {step.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {step.status === 'in_progress' && <RefreshCw className="h-4 w-4 text-cyan-400 animate-spin" />}
                  {step.status === 'pending' && <div className="h-4 w-4 rounded-full border border-slate-700" />}
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${
                    step.status === 'complete' ? 'text-emerald-300' : step.status === 'in_progress' ? 'text-cyan-300' : 'text-slate-500'
                  }`}>
                    Step {step.step}: {step.label}
                  </div>
                  {step.details && <div className="text-[11px] text-slate-400 mt-0.5">{step.details}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prominent Deployed Contract Address Card (Requirement: After success, show the deployed contract address) */}
        {(deploymentResult || ledgerState.contractAddress) && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 sm:p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>Active Deployed Contract on Midnight Preprod</span>
              </div>
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] text-cyan-300 font-bold uppercase">
                Live & Verifiable
              </span>
            </div>

            <div className="space-y-3 text-slate-300">
              {/* Explorer Hex Address */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 font-sans text-[11px] mb-1">
                  <span className="font-semibold text-slate-300">Explorer Hex Contract Address:</span>
                  <button
                    onClick={() => handleCopy(deploymentResult?.hexAddress || ledgerState.contractAddress, 'hex')}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    {copiedKey === 'hex' ? 'Copied!' : 'Copy Hex'}
                  </button>
                </div>
                <div className="text-cyan-300 text-xs break-all font-bold select-all">
                  {deploymentResult?.hexAddress || ledgerState.contractAddress}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-1">
                  Searchable directly on preprod.midnightexplorer.com
                </div>
              </div>

              {/* Bech32m Address */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 font-sans text-[11px] mb-1">
                  <span className="font-semibold text-slate-300">Bech32m Contract Address (Rise In):</span>
                  <button
                    onClick={() => handleCopy(deploymentResult?.bech32mAddress || ledgerState.preprodBech32m, 'bech')}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    {copiedKey === 'bech' ? 'Copied!' : 'Copy Bech32m'}
                  </button>
                </div>
                <div className="text-emerald-300 text-xs break-all font-bold select-all">
                  {deploymentResult?.bech32mAddress || ledgerState.preprodBech32m}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-1">
                  Format required for Rise In Level 4 challenge submission form
                </div>
              </div>

              {/* Deployment Transaction Hash */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 font-sans text-[11px] mb-1">
                  <span className="font-semibold text-slate-300">Deployment Transaction Hash:</span>
                  <button
                    onClick={() => handleCopy(deploymentResult?.txHash || ledgerState.deploymentTxHash, 'tx')}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    {copiedKey === 'tx' ? 'Copied!' : 'Copy Tx Hash'}
                  </button>
                </div>
                <div className="text-slate-300 text-xs break-all select-all">
                  {deploymentResult?.txHash || ledgerState.deploymentTxHash}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans">
              <span className="text-slate-400 text-[11px]">
                Contract verified on Preprod network indexer and ready for settlement batches.
              </span>
              <a
                href={`https://preprod.midnightexplorer.com/contracts/${deploymentResult?.hexAddress || ledgerState.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold shrink-0"
              >
                <span>View on Midnight Explorer</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
