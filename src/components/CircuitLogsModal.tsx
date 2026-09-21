import React from 'react';
import {
  X,
  Activity,
  CheckCircle2,
  Clock,
  Hash,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { ZKProofLog } from '../midnight/types';

interface CircuitLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ZKProofLog[];
}

export const CircuitLogsModal: React.FC<CircuitLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-cyan-500/30 bg-[#0b0f19] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Zero-Knowledge Circuit Prover Logs
              </h3>
              <p className="text-xs text-slate-400">
                Live constraint verification & witness execution history
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-800/80">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No ZK circuits executed yet in this session.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="pt-4 first:pt-0 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300 font-sans text-xs">
                      {log.circuitName}
                    </span>
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{log.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{log.executionTimeMs}ms</span>
                    </span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="text-slate-300 font-sans text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                  {log.witnessSummary}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    <span className="text-slate-500">ZK Proof Hash: </span>
                    <span className="text-slate-300 break-all">{log.zkProofHash.substring(0, 22)}...</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tx Hash: </span>
                    <span className="text-slate-300 break-all">{log.txHash.substring(0, 22)}...</span>
                  </div>
                </div>

                {/* Public Inputs */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-[11px]">
                  <span className="text-slate-500 font-sans block mb-1">Public Inputs (On-Chain):</span>
                  <pre className="text-cyan-300 overflow-x-auto">
                    {JSON.stringify(log.publicInputs, null, 2)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
