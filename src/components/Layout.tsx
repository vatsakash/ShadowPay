import React from 'react';
import { Shield, Sparkles, ExternalLink, Github, Twitter } from 'lucide-react';
import { WalletConnect } from './WalletConnect';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  proofCount: number;
  onOpenProofs: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  proofCount,
  onOpenProofs,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background radial gradient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]"></div>

      {/* Main App Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">ShadowPay</span>
                <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                  Preprod
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Confidential Payroll & Revenue-Split Settlement on Midnight
              </p>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenProofs}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-cyan-300 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>ZK Proofs</span>
              <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-bold">
                {proofCount}
              </span>
            </button>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm py-6 relative z-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>Built with Compact v0.23 / Minokawa</span>
            <span>•</span>
            <span className="text-slate-400">Midnight Preprod Network</span>
          </div>

          <div className="flex items-center gap-5 text-slate-400">
            <a
              href="https://x.com/ShadowPayShadow"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
            >
              <Twitter className="h-3.5 w-3.5" />
              <span>@ShadowPayShadow</span>
            </a>

            <a
              href="https://github.com/vatsakash/ShadowPay"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>

            <a
              href="https://explorer.1am.xyz/contract/89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
            >
              <span>1AM Explorer</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
