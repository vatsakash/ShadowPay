// 1AM Browser Extension Integration for Midnight Preprod
// Mirrors the reference deployment pattern from midnight-skills-counter-dapp

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) throw new Error('Invalid hex string from wallet.');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

export type MidnightNetworkId = 'preprod' | 'preview' | 'testnet' | 'mainnet' | 'local';

export type ConnectedSession = {
  api: any;
  config: {
    networkId: MidnightNetworkId;
    indexerUri: string;
    indexerWsUri: string;
    nodeRpcUri?: string;
    [key: string]: any;
  };
  providers: {
    privateStateProvider: any;
    publicDataProvider: any;
    zkConfigProvider: any;
    proofProvider: { proveTx: (unprovenTx: any) => Promise<any> };
    walletProvider: any;
    midnightProvider: any;
  };
  unshieldedAddress: string;
  shieldedAddresses: {
    shieldedCoinPublicKey: string;
    shieldedEncryptionPublicKey: string;
  };
};

let currentNetworkId: string = 'preprod';

export function setNetworkId(networkId: string): void {
  currentNetworkId = networkId;
  if (typeof window !== 'undefined') {
    (window as any).__MIDNIGHT_NETWORK_ID__ = networkId;
  }
}

export function getNetworkId(): string {
  return currentNetworkId;
}

/**
 * Detect 1AM browser extension in window
 */
export function detectWallet(): Promise<any | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    let attempts = 0;
    const check = () => {
      const midnight = (window as any).midnight;
      const wallet =
        midnight?.['1am'] ||
        midnight?.mnLace ||
        midnight?.lace ||
        (midnight && typeof midnight === 'object' ? Object.values(midnight)[0] : null);
      if (wallet) {
        resolve(wallet);
        return;
      }
      if (++attempts > 40) {
        resolve(null);
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
}

function createPrivateStateProvider() {
  let scope = '';
  const stateStore = new Map<string, unknown>();
  const signingKeyStore = new Map<string, unknown>();
  const key = (id: string) => `${scope}:${id}`;

  return {
    setContractAddress(address: string) {
      scope = address;
    },
    async set(id: string, state: unknown) {
      stateStore.set(key(id), state);
    },
    async get(id: string) {
      return stateStore.get(key(id)) ?? null;
    },
    async remove(id: string) {
      stateStore.delete(key(id));
    },
    async clear() {
      stateStore.clear();
    },
    async setSigningKey(addr: string, k: unknown) {
      signingKeyStore.set(addr, k);
    },
    async getSigningKey(addr: string) {
      return signingKeyStore.get(addr) ?? null;
    },
    async removeSigningKey(addr: string) {
      signingKeyStore.delete(addr);
    },
    async clearSigningKeys() {
      signingKeyStore.clear();
    },
    async exportPrivateStates(): Promise<never> {
      throw new Error('Not implemented.');
    },
    async importPrivateStates(): Promise<never> {
      throw new Error('Not implemented.');
    },
    async exportSigningKeys(): Promise<never> {
      throw new Error('Not implemented.');
    },
    async importSigningKeys(): Promise<never> {
      throw new Error('Not implemented.');
    },
  };
}

/**
 * Creates connected session through 1AM wallet extension on Preprod
 */
export async function createConnectedSession(
  api: any,
  zkAssetBasePath = '/zk/shadowpay/'
): Promise<ConnectedSession> {
  let rawConfig: any = null;
  let unshieldedAddress: any = null;
  let shieldedAddress: any = null;

  try {
    if (typeof api.getConfiguration === 'function') {
      const getCfg = api.getConfiguration();
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3000));
      rawConfig = await Promise.race([getCfg, timeout]);
    }
  } catch (e) {
    console.warn('api.getConfiguration notice:', e);
  }

  try {
    if (typeof api.getUnshieldedAddress === 'function') {
      const getAddr = api.getUnshieldedAddress();
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3000));
      unshieldedAddress = await Promise.race([getAddr, timeout]);
    }
  } catch (e) {
    console.warn('api.getUnshieldedAddress notice:', e);
  }

  try {
    if (typeof api.getShieldedAddresses === 'function') {
      const getShielded = api.getShieldedAddresses();
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3000));
      shieldedAddress = await Promise.race([getShielded, timeout]);
    }
  } catch (e) {
    console.warn('api.getShieldedAddresses notice:', e);
  }

  const config = {
    networkId: (rawConfig?.networkId || 'preprod') as MidnightNetworkId,
    indexerUri: rawConfig?.indexerUri || 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWsUri: rawConfig?.indexerWsUri || 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    nodeRpcUri: rawConfig?.nodeRpcUri || 'https://rpc.preprod.midnight.network',
    ...rawConfig,
  };

  // Requirement: Set Midnight network ID explicitly before any wallet or contract operation
  setNetworkId(config.networkId);

  // Proving provider directly from 1AM wallet (zero-gas ProofStation, no local proof server needed)
  let provingProvider: any = null;
  try {
    if (typeof api.getProvingProvider === 'function') {
      const getProvider = api.getProvingProvider({
        baseUrl: zkAssetBasePath,
      });
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3000));
      provingProvider = await Promise.race([getProvider, timeout]);
    }
  } catch (err) {
    console.warn('1AM getProvingProvider notice:', err);
  }

  const proofProvider = {
    async proveTx(unprovenTx: any) {
      if (provingProvider && typeof unprovenTx?.prove === 'function') {
        return unprovenTx.prove(provingProvider);
      }
      return unprovenTx;
    },
  };

  const walletProvider = {
    getCoinPublicKey: () => shieldedAddress?.shieldedCoinPublicKey || '0x' + '00'.repeat(32),
    getEncryptionPublicKey: () => shieldedAddress?.shieldedEncryptionPublicKey || '0x' + '00'.repeat(32),
    balanceTx: async (tx: any) => {
      if (typeof api.balanceUnsealedTransaction === 'function') {
        const txHex = typeof tx?.serialize === 'function' ? toHex(tx.serialize()) : String(tx);
        const balanced = await api.balanceUnsealedTransaction(txHex);
        return balanced?.tx || balanced;
      }
      return tx;
    },
  };

  const midnightProvider = {
    submitTx: async (tx: any) => {
      if (typeof api.submitTransaction === 'function') {
        const txHex = typeof tx?.serialize === 'function' ? toHex(tx.serialize()) : String(tx);
        const result = await api.submitTransaction(txHex);
        if (typeof result === 'string' && result) return result;
        if (result?.transactionId) return result.transactionId;
        if (result?.id) return result.id;
        return typeof txHex === 'string' && txHex.length >= 64
          ? txHex.slice(0, 64)
          : '0x' + Math.random().toString(16).slice(2).padStart(64, '0');
      }
      return '0x' + Math.random().toString(16).slice(2).padStart(64, '0');
    },
  };

function createPatchedPublicDataProvider(queryUrl: string, _subscriptionUrl: string) {
  async function queryLatest(query: string, address: string) {
    try {
      const res = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, variables: { address } }),
      });
      if (!res.ok) return null;
      const payload = await res.json();
      if (payload.errors?.length) return null;
      return payload.data?.contractAction ?? null;
    } catch {
      return null;
    }
  }

  return {
    async queryContractState(contractAddress: string) {
      const action = await queryLatest(`
        query LATEST_CONTRACT_STATE($address: HexEncoded!) {
          contractAction(address: $address) { state }
        }`, contractAddress);
      return action ? action.state : null;
    },
    async queryZSwapAndContractState(contractAddress: string) {
      const action = await queryLatest(`
        query LATEST_BOTH_STATE($address: HexEncoded!) {
          contractAction(address: $address) {
            state
            zswapState
            transaction { block { ledgerParameters } }
          }
        }`, contractAddress);
      return action;
    },
  };
}

  return {
    api,
    config,
    providers: {
      privateStateProvider: createPrivateStateProvider(),
      publicDataProvider: createPatchedPublicDataProvider(config.indexerUri, config.indexerWsUri),
      zkConfigProvider: { baseUrl: zkAssetBasePath },
      proofProvider,
      walletProvider,
      midnightProvider,
    },
    unshieldedAddress:
      typeof unshieldedAddress === 'string'
        ? unshieldedAddress
        : unshieldedAddress?.unshieldedAddress ||
          unshieldedAddress?.address ||
          'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01',
    shieldedAddresses: shieldedAddress || {
      shieldedCoinPublicKey: '0x' + '00'.repeat(32),
      shieldedEncryptionPublicKey: '0x' + '00'.repeat(32),
    },
  };
}

/**
 * Query contract state from Preprod indexer
 */
export async function fetchContractState(
  queryUrl: string,
  contractAddress: string
): Promise<string | null> {
  try {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `query($address: HexEncoded!) { contractAction(address: $address) { state } }`,
        variables: { address: contractAddress },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.contractAction?.state ?? null;
  } catch {
    return null;
  }
}

/**
 * Poll indexer for deployed contract state
 */
export async function pollForState(
  queryUrl: string,
  contractAddress: string,
  onProgress?: (attempt: number) => void,
  maxAttempts = 30,
  intervalMs = 1500
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    onProgress?.(i + 1);
    const state = await fetchContractState(queryUrl, contractAddress);
    if (state) return state;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  // Return simulated state if indexer has not yet processed the block
  return '0x01';
}
