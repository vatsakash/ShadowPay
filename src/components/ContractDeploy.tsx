import React, { useState } from 'react';
import {
  Rocket,
  Shield,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Copy,
  Terminal,
  Cpu,
  Radio,
  FileCode,
  Sparkles
} from 'lucide-react';
import { BrowserDeployer, DeploymentStepLog } from '../midnight/browserDeployer';
import { ContractDeploymentInfo, PayrollLedgerState } from '../midnight/types';
import { ShadowPayEngine } from '../midnight/ShadowPaySimulator';

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

  const handleStartDeployment = async () => {
    setIsDeploying(true);
    setDeploymentResult(null);

    try {
      const result = await BrowserDeployer.deployToPreprod(
        ledgerState.adminPk,
        (steps) => setDeploymentSteps(steps)
      );

      setDeploymentResult(result);
      onDeploymentSuccess();
    } catch (err) {
      console.error('Deployment failed:', err);
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
      {/* Header */}
      <div className="glass-panel-glow rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400 border border-cyan-500/30">
            <Rocket className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">In-Browser 1AM Preprod Contract Deployer</h2>
            <p className="text-xs text-slate-300">
              Deploy a fresh instance of <code className="text-cyan-300">ShadowPay.compact</code> directly to Midnight Preprod
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>Network: Midnight Preprod</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            <span>Zero-Gas Proving: 1AM ProofStation</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <FileCode className="h-3.5 w-3.5 text-violet-400" />
            <span>DSL: Compact v0.23 / Minokawa</span>
          </div>
        </div>
      </div>

      {/* Main Deploy Box */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-white">Deploy ShadowPay Protocol</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates cryptographic zk-SNARK proving keys, signs deployment with your 1AM wallet, and broadcasts to Preprod.
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
                <span>Deploying to Preprod...</span>
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
            <div className="text-slate-400 font-sans font-semibold text-xs mb-2">Deployment Pipeline Progress:</div>
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

        {/* Deployment Success Card */}
        {deploymentResult && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>Contract Successfully Deployed to Midnight Preprod!</span>
            </div>

            <div className="space-y-2 pt-2 text-slate-300">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans">Explorer Hex Address:</span>
                  <span className="text-cyan-300 break-all">{deploymentResult.hexAddress}</span>
                </div>
                <button
                  onClick={() => handleCopy(deploymentResult.hexAddress, 'res-hex')}
                  className="ml-3 text-cyan-400 hover:text-cyan-300 shrink-0 font-sans text-xs"
                >
                  {copiedKey === 'res-hex' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans">Bech32m Address (Rise In):</span>
                  <span className="text-emerald-300 break-all">{deploymentResult.bech32mAddress}</span>
                </div>
                <button
                  onClick={() => handleCopy(deploymentResult.bech32mAddress, 'res-bech')}
                  className="ml-3 text-cyan-400 hover:text-cyan-300 shrink-0 font-sans text-xs"
                >
                  {copiedKey === 'res-bech' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans">Deployment Tx Hash:</span>
                  <span className="text-slate-300 break-all">{deploymentResult.txHash}</span>
                </div>
                <button
                  onClick={() => handleCopy(deploymentResult.txHash, 'res-tx')}
                  className="ml-3 text-cyan-400 hover:text-cyan-300 shrink-0 font-sans text-xs"
                >
                  {copiedKey === 'res-tx' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={`https://preprod.midnightexplorer.com/contracts/${deploymentResult.hexAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-sans font-semibold"
              >
                <span>Verify on Preprod Explorer</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
