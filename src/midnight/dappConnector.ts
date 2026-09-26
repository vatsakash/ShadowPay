// 1AM Browser Wallet & Midnight DApp Connector Integration
// Connects to Midnight Preprod network via 1AM Extension API

import {
  detectWallet,
  setNetworkId,
  createConnectedSession,
  ConnectedSession,
} from './midnight1am';

export interface MidnightWalletState {
  isConnected: boolean;
  address: string | null;
  networkId: string;
  balance: bigint;
  walletName: string;
  isInstalled: boolean;
  isReal1AM: boolean;
}

export class MidnightDAppConnector {
  private static instance: MidnightDAppConnector;
  private session: ConnectedSession | null = null;
  private state: MidnightWalletState = {
    isConnected: false,
    address: null,
    networkId: 'preprod',
    balance: 150000n, // 150,000 tNIGHT test balance
    walletName: '1AM Wallet',
    isInstalled: false,
    isReal1AM: false,
  };

  private listeners: ((state: MidnightWalletState) => void)[] = [];

  private constructor() {
    this.checkWalletAvailability();
  }

  public static getInstance(): MidnightDAppConnector {
    if (!MidnightDAppConnector.instance) {
      MidnightDAppConnector.instance = new MidnightDAppConnector();
    }
    return MidnightDAppConnector.instance;
  }

  public async checkWalletAvailability(): Promise<boolean> {
    const wallet = await detectWallet();
    const hasWallet = wallet !== null;
    this.state.isInstalled = hasWallet;
    this.notify();
    return hasWallet;
  }

  public getState(): MidnightWalletState {
    return { ...this.state };
  }

  public getSession(): ConnectedSession | null {
    return this.session;
  }

  public subscribe(listener: (state: MidnightWalletState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  public async connect(): Promise<MidnightWalletState> {
    // Explicitly set network ID to preprod before wallet interaction
    setNetworkId('preprod');

    const wallet = await detectWallet();

    if (wallet) {
      try {
        let api: any = null;
        if (typeof wallet.connect === 'function') {
          api = await wallet.connect('preprod');
        } else if (typeof wallet.enable === 'function') {
          api = await wallet.enable();
        } else {
          api = wallet;
        }

        if (api) {
          this.session = await createConnectedSession(api, '/zk/shadowpay/');
          this.state.isConnected = true;
          this.state.isInstalled = true;
          this.state.isReal1AM = true;
          this.state.address = this.session.unshieldedAddress;
          this.state.networkId = this.session.config.networkId || 'preprod';
          this.state.walletName = '1AM Wallet (Preprod)';

          // Attempt to retrieve real balance if exposed
          try {
            if (typeof api.getBalance === 'function') {
              const bal = await api.getBalance();
              if (typeof bal === 'bigint') this.state.balance = bal;
              else if (typeof bal === 'number') this.state.balance = BigInt(bal);
            }
          } catch {
            // Keep default balance
          }

          this.notify();
          return this.getState();
        }
      } catch (err: any) {
        console.warn('1AM connection prompt cancelled or failed:', err);
        throw new Error(err?.message || 'Failed to connect to 1AM wallet extension');
      }
    }

    // Preprod simulation fallback if extension is not installed
    this.state.isConnected = true;
    this.state.isInstalled = false;
    this.state.isReal1AM = false;
    this.state.address = 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01';
    this.state.networkId = 'preprod';
    this.state.walletName = '1AM (Preprod Simulator)';
    this.notify();

    return this.getState();
  }

  public async executeOnChainTransaction(txPayloadHex: string): Promise<{ txHash: string; via1AM: boolean }> {
    // If not connected, connect first
    if (!this.state.isConnected || !this.session) {
      await this.connect();
    }

    // If 1AM session is live, balance and submit via 1AM wallet (triggers 1AM extension popup)
    if (this.session?.providers?.walletProvider) {
      try {
        // 1. Balance transaction through 1AM (Triggers 1AM extension popup for user approval)
        const balancedTx = await this.session.providers.walletProvider.balanceTx(txPayloadHex);

        // 2. Submit transaction to Preprod network via 1AM
        const txHash = await this.session.providers.midnightProvider.submitTx(balancedTx);
        return { txHash, via1AM: true };
      } catch (err: any) {
        console.error('1AM transaction rejected or failed:', err);
        throw new Error(`1AM Wallet: ${err?.message || 'Transaction was rejected or failed in extension'}`);
      }
    }

    // Simulated transaction hash for demo/testing without extension
    const simulatedTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return { txHash: simulatedTx, via1AM: false };
  }

  public disconnect(): void {
    this.state.isConnected = false;
    this.state.address = null;
    this.state.isReal1AM = false;
    this.session = null;
    this.notify();
  }

  public switchNetwork(networkId: 'preprod' | 'preview' | 'local'): void {
    this.state.networkId = networkId;
    setNetworkId(networkId);
    this.notify();
  }
}
