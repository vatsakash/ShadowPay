import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminPayroll } from './components/AdminPayroll';
import { RecipientClaim } from './components/RecipientClaim';
import { AuditDisclosure } from './components/AuditDisclosure';
import { PublicTransparencyExplorer } from './components/PublicTransparencyExplorer';
import { ContractDeploy } from './components/ContractDeploy';
import { DeveloperIntegrationGuide } from './components/DeveloperIntegrationGuide';
import { CircuitLogsModal } from './components/CircuitLogsModal';

import { ShadowPayEngine } from './midnight/ShadowPaySimulator';
import { MidnightDAppConnector, MidnightWalletState } from './midnight/dappConnector';
import { setNetworkId } from './midnight/midnight1am';
import { PayrollLedgerState, RecipientSplitRule, ZKProofLog } from './midnight/types';
import { Shield, Github, Twitter, ExternalLink } from 'lucide-react';

export default function App() {
  const engine = ShadowPayEngine.getInstance();
  const connector = MidnightDAppConnector.getInstance();

  // Detect route from URL (/deploy or #deploy)
  const getInitialTab = (): string => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('/deploy') || hash === '#deploy') return 'deploy';
      if (path.includes('/claim') || hash === '#claim') return 'claim';
      if (path.includes('/audit') || hash === '#audit') return 'audit';
      if (path.includes('/explorer') || hash === '#explorer') return 'explorer';
      if (path.includes('/docs') || hash === '#docs') return 'docs';
    }
    return 'admin';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab());
  const [ledgerState, setLedgerState] = useState<PayrollLedgerState>(engine.getLedgerState());
  const [splits, setSplits] = useState<RecipientSplitRule[]>(engine.getPrivateSplits());
  const [proofLogs, setProofLogs] = useState<ZKProofLog[]>(engine.getProofLogs());
  const [walletState, setWalletState] = useState<MidnightWalletState>(connector.getState());
  const [isLogsModalOpen, setIsLogsModalOpen] = useState<boolean>(false);
  const [selectedReceiptSplitId, setSelectedReceiptSplitId] = useState<string>('');

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetUrl = tab === 'admin' ? '/' : `/${tab}`;
      window.history.pushState(null, '', targetUrl);
    }
  };

  useEffect(() => {
    // Requirement: Set Midnight network ID explicitly before any wallet or contract operation
    setNetworkId('preprod');

    // Poll/detect wallet presence on startup
    connector.checkWalletAvailability();

    const handlePopState = () => {
      setActiveTabState(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);

    const unsubscribe = connector.subscribe((state) => {
      setWalletState(state);
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      unsubscribe();
    };
  }, [connector]);

  const handleRefresh = () => {
    setLedgerState(engine.getLedgerState());
    setSplits(engine.getPrivateSplits());
    setProofLogs(engine.getProofLogs());
  };

  const handleProofGenerated = (_proof: ZKProofLog) => {
    handleRefresh();
  };

  const handleConnectWallet = async () => {
    await connector.connect();
  };

  const handleDisconnectWallet = () => {
    connector.disconnect();
  };

  const handleSelectReceipt = (splitId: string) => {
    setSelectedReceiptSplitId(splitId);
    setActiveTab('audit');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletState={walletState}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        proofLogCount={proofLogs.length}
        onOpenLogsModal={() => setIsLogsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6">
        {activeTab === 'admin' && (
          <AdminPayroll
            ledgerState={ledgerState}
            splits={splits}
            onRefresh={handleRefresh}
            onProofGenerated={handleProofGenerated}
          />
        )}

        {activeTab === 'claim' && (
          <RecipientClaim
            ledgerState={ledgerState}
            splits={splits}
            onRefresh={handleRefresh}
            onProofGenerated={handleProofGenerated}
            onSelectReceipt={handleSelectReceipt}
          />
        )}

        {activeTab === 'audit' && (
          <AuditDisclosure
            ledgerState={ledgerState}
            splits={splits}
            initialSplitId={selectedReceiptSplitId}
          />
        )}

        {activeTab === 'explorer' && (
          <PublicTransparencyExplorer
            ledgerState={ledgerState}
            splits={splits}
          />
        )}

        {activeTab === 'deploy' && (
          <ContractDeploy
            ledgerState={ledgerState}
            onDeploymentSuccess={handleRefresh}
          />
        )}

        {activeTab === 'docs' && (
          <DeveloperIntegrationGuide />
        )}
      </main>

      {/* Circuit Logs Modal */}
      <CircuitLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        logs={proofLogs}
      />

      {/* Global Footer */}
      <footer className="border-t border-slate-800/80 bg-[#05080f] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-slate-300">ShadowPay Protocol</span>
            <span>• Midnight Preprod Network</span>
          </div>

          <div className="flex items-center gap-5 text-slate-400">
            <a
              href="https://x.com/ShadowPayHQ"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
            >
              <Twitter className="h-3.5 w-3.5" />
              <span>@ShadowPayHQ</span>
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
              href={`https://preprod.midnightexplorer.com/contracts/${ledgerState.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
            >
              <span>Explorer</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
