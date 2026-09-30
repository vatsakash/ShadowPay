import React from 'react';
import {
  Shield,
  Wallet,
  Activity,
  ChevronRight,
  ExternalLink,
  Layers,
  FileCheck,
  Eye,
  Rocket,
  BookOpen
} from 'lucide-react';
import { MidnightWalletState } from '../midnight/dappConnector';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  walletState: MidnightWalletState;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  proofLogCount: number;
  onOpenLogsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  walletState,
  onConnectWallet,
  onDisconnectWallet,
  proofLogCount,
  onOpenLogsModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                ShadowPay
              </span>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">
                Preprod
              </span>
              {walletState.isConnected ? (
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live On-Chain
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1" title="Client sandbox simulation mode. Connect 1AM wallet for live Midnight Preprod settlement.">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  Demo Simulator
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Confidential Payroll & Revenue-Split Settlement on Midnight
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800/80 text-sm">
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'admin'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Admin Settlement</span>
          </button>

          <button
            onClick={() => setActiveTab('claim')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'claim'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>Recipient Claim</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'audit'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>Audit Receipts</span>
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'explorer'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'deploy'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Rocket className="h-4 w-4" />
            <span>Deploy</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'docs'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Docs</span>
          </button>
        </nav>

        {/* Right Actions: Proof Logs & Wallet */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ZK Proof Logs Inspector Button */}
          <button
            onClick={onOpenLogsModal}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
            title="Inspect Zero-Knowledge Circuit Proof Logs"
          >
            <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">ZK Proofs</span>
            <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] text-cyan-300 font-mono">
              {proofLogCount}
            </span>
          </button>

          {/* 1AM Wallet Connect */}
          {walletState.isConnected ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-mono font-semibold text-slate-200">
                  {walletState.balance.toLocaleString()} tNIGHT
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {walletState.address?.substring(0, 10)}...{walletState.address?.substring(walletState.address.length - 4)}
                </span>
              </div>
              <button
                onClick={onDisconnectWallet}
                className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-all"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Connect 1AM</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/80 px-2 py-2 text-xs">
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-2 py-1 rounded ${activeTab === 'admin' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
        >
          Admin
        </button>
        <button
          onClick={() => setActiveTab('claim')}
          className={`px-2 py-1 rounded ${activeTab === 'claim' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
        >
          Claim
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-2 py-1 rounded ${activeTab === 'audit' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
        >
          Receipts
        </button>
        <button
          onClick={() => setActiveTab('explorer')}
          className={`px-2 py-1 rounded ${activeTab === 'explorer' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
        >
          Explorer
        </button>
        <button
          onClick={() => setActiveTab('deploy')}
          className={`px-2 py-1 rounded ${activeTab === 'deploy' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
        >
          Deploy
        </button>
      </div>
    </header>
  );
};
