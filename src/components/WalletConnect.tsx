import React from 'react';
import { Wallet, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMidnight } from '../hooks/useMidnight';

interface WalletConnectProps {
  className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ className = '' }) => {
  const { isConnected, isConnecting, address, networkId, balance, error, connect, disconnect } = useMidnight();

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 px-3 py-1.5 rounded-xl font-mono text-xs shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-cyan-300 font-semibold">{balance.toLocaleString()} tNIGHT</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 select-all" title={address}>
            {address.slice(0, 10)}...{address.slice(-4)}
          </span>
          <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[9px] text-cyan-300 font-bold uppercase">
            {networkId}
          </span>
        </div>

        <button
          onClick={disconnect}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition-colors"
          title="Disconnect 1AM Wallet"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {error && (
        <span className="text-red-400 text-xs flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{error}</span>
        </span>
      )}
      <button
        onClick={connect}
        disabled={isConnecting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
      >
        <Wallet className="h-4 w-4" />
        <span>{isConnecting ? 'Connecting 1AM...' : 'Connect 1AM Wallet'}</span>
      </button>
    </div>
  );
};
