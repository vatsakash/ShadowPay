import { useState, useEffect, useCallback } from 'react';
import {
  detectWallet,
  createConnectedSession,
  getNetworkId,
  setNetworkId,
  ConnectedSession,
} from '../midnight/midnight1am';

export interface UseMidnightState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  networkId: string;
  balance: number;
  session: ConnectedSession | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useMidnight(): UseMidnightState {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>('mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01');
  const [networkId, setNetId] = useState<string>('preprod');
  const [balance, setBalance] = useState<number>(150000);
  const [session, setSession] = useState<ConnectedSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNetworkId('preprod');
    setNetId(getNetworkId());
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      setNetworkId('preprod');
      const wallet = await detectWallet();
      if (wallet) {
        const api = typeof wallet.connect === 'function' ? await wallet.connect('preprod') : wallet;
        const sess = await createConnectedSession(api, '/zk/shadowpay/');
        setSession(sess);
        setAddress(sess.unshieldedAddress || 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01');
        setIsConnected(true);
      } else {
        // Connected in simulated Preprod mode
        setIsConnected(true);
        setAddress('mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not connect to 1AM extension');
      // Graceful fallback to preprod demo session
      setIsConnected(true);
      setAddress('mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setSession(null);
  }, []);

  return {
    isConnected,
    isConnecting,
    address,
    networkId,
    balance,
    session,
    error,
    connect,
    disconnect,
  };
}
