'use client';

import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3AuthModal } from '@web3auth/modal';
import React, { useEffect, useState } from 'react';

interface Web3AuthProviderProps {
  children: React.ReactNode;
}

export function Web3AuthProvider({ children }: Web3AuthProviderProps) {
  const [web3auth, setWeb3auth] = useState<Web3AuthModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
        if (!clientId) {
          console.warn('Web3Auth Client ID not configured');
          return;
        }

        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: '0x1', // Ethereum Mainnet
          rpcTarget: 'https://rpc.ankr.com/eth',
          displayName: 'Ethereum Mainnet',
          blockExplorerUrl: 'https://etherscan.io',
          ticker: 'ETH',
          tickerName: 'Ethereum',
          logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        };

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3authInstance = new Web3AuthModal({
          clientId,
          web3AuthNetwork:
            (process.env.WEB3AUTH_NETWORK as WEB3AUTH_NETWORK) || WEB3AUTH_NETWORK.MAINNET,
          chainConfig,
          privateKeyProvider,
          uiConfig: {
            appName: 'Advancia PayLedger',
            mode: 'light',
            logoLight: 'https://advanciapayledger.com/logo.png',
            logoDark: 'https://advanciapayledger.com/logo.png',
            defaultLanguage: 'en',
            loginGridCol: 3,
            primaryButton: 'externalLogin',
          },
        });

        await web3authInstance.init();
        setWeb3auth(web3authInstance);

        if (web3authInstance.connected) {
          setProvider(web3authInstance.provider);
          setLoggedIn(true);
        }
      } catch (error) {
        console.error('Web3Auth initialization error:', error);
      }
    };

    init();
  }, []);

  const connect = async () => {
    if (!web3auth) {
      console.error('Web3Auth not initialized');
      return;
    }

    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      setLoggedIn(true);
    } catch (error) {
      console.error('Web3Auth connection error:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (!web3auth) {
      return;
    }

    try {
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
    } catch (error) {
      console.error('Web3Auth disconnect error:', error);
    }
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      return null;
    }

    try {
      const user = await web3auth.getUserInfo();
      return user;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  };

  const getAccounts = async () => {
    if (!provider) {
      return [];
    }

    try {
      const accounts = await provider.request({ method: 'eth_accounts' });
      return accounts as string[];
    } catch (error) {
      console.error('Failed to get accounts:', error);
      return [];
    }
  };

  const getBalance = async (address: string) => {
    if (!provider) {
      return '0';
    }

    try {
      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      return balance as string;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        provider,
        loggedIn,
        connect,
        disconnect,
        getUserInfo,
        getAccounts,
        getBalance,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
}

interface Web3AuthContextType {
  web3auth: Web3AuthModal | null;
  provider: IProvider | null;
  loggedIn: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getUserInfo: () => Promise<any>;
  getAccounts: () => Promise<string[]>;
  getBalance: (address: string) => Promise<string>;
}

const Web3AuthContext = React.createContext<Web3AuthContextType>({
  web3auth: null,
  provider: null,
  loggedIn: false,
  connect: async () => {},
  disconnect: async () => {},
  getUserInfo: async () => null,
  getAccounts: async () => [],
  getBalance: async () => '0',
});

export function useWeb3Auth() {
  return React.useContext(Web3AuthContext);
}
