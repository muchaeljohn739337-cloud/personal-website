'use client';

import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3Auth } from '@web3auth/modal';
import { createContext, useContext, useEffect, useState } from 'react';

interface Web3AuthProviderProps {
  children: React.ReactNode;
}

// Supported chain configurations
export const CHAIN_CONFIGS = {
  ethereum: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x1', // Ethereum Mainnet
    rpcTarget: 'https://rpc.ankr.com/eth',
    displayName: 'Ethereum Mainnet',
    blockExplorerUrl: 'https://etherscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  polygon: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x89', // Polygon Mainnet
    rpcTarget: 'https://rpc.ankr.com/polygon',
    displayName: 'Polygon Mainnet',
    blockExplorerUrl: 'https://polygonscan.com',
    ticker: 'MATIC',
    tickerName: 'Polygon',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  },
  arbitrum: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0xa4b1', // Arbitrum One
    rpcTarget: 'https://rpc.ankr.com/arbitrum',
    displayName: 'Arbitrum One',
    blockExplorerUrl: 'https://arbiscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
  },
  base: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x2105', // Base Mainnet
    rpcTarget: 'https://mainnet.base.org',
    displayName: 'Base Mainnet',
    blockExplorerUrl: 'https://basescan.org',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    logo: 'https://cryptologos.cc/logos/base-base-logo.png',
  },
} as const;

export type ChainId = keyof typeof CHAIN_CONFIGS;

export function Web3AuthProvider({ children }: Web3AuthProviderProps) {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentChain, setCurrentChain] = useState<ChainId>('ethereum');

  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    const init = async (attempt = 1) => {
      try {
        const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
        if (!clientId) {
          console.warn(
            'Web3Auth Client ID not configured. Please add NEXT_PUBLIC_WEB3AUTH_CLIENT_ID to your .env.local'
          );
          return;
        }

        // Validate Client ID format
        if (clientId.length < 20) {
          console.error(
            'Web3Auth Client ID appears to be invalid or truncated. Expected full Client ID from Web3Auth dashboard.'
          );
          return;
        }

        // Initialize with Ethereum Mainnet as default
        const defaultChainConfig = CHAIN_CONFIGS.ethereum;

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig: defaultChainConfig },
        });

        // Get network from environment or default to MAINNET
        const networkEnv = process.env.WEB3AUTH_NETWORK;
        const network =
          (networkEnv as (typeof WEB3AUTH_NETWORK)[keyof typeof WEB3AUTH_NETWORK]) ||
          WEB3AUTH_NETWORK.MAINNET;

        console.log('Initializing Web3Auth with:', {
          clientId: `${clientId.substring(0, 20)}...`,
          network,
          chainId: defaultChainConfig.chainId,
        });

        // Initialize Web3Auth modal
        const web3authInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: network,
          chainConfig: defaultChainConfig,
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

        try {
          await web3authInstance.init();
          setWeb3auth(web3authInstance);

          if (web3authInstance.connected) {
            setProvider(web3authInstance.provider);
            setLoggedIn(true);
          }
          console.log('Web3Auth initialized successfully');
        } catch (initError: unknown) {
          // Better error serialization
          let errorMessage = 'Unknown error';
          let errorCode: string | undefined;

          if (initError instanceof Error) {
            errorMessage = initError.message;
            errorCode = (initError as { code?: string }).code;
          } else if (typeof initError === 'object' && initError !== null) {
            const error = initError as { message?: string; code?: string; toString?: () => string };
            errorMessage = error.message || error.toString?.() || JSON.stringify(error);
            errorCode = error.code;
          } else {
            errorMessage = String(initError);
          }

          console.error('Web3Auth initialization failed:', {
            message: errorMessage,
            code: errorCode,
            clientId: `${clientId.substring(0, 20)}...`,
            network,
          });

          // Provide helpful error messages
          if (
            errorMessage.includes('Project not found') ||
            errorMessage.includes('not found') ||
            errorMessage.includes('Wallet is not ready yet')
          ) {
            console.error(
              '❌ Web3Auth Project Error:\n' +
                '   - Verify your Client ID is correct: ' +
                clientId.substring(0, 30) +
                '...\n' +
                '   - Check your Web3Auth dashboard: https://dashboard.web3auth.io/organization/advanciapay/projects\n' +
                '   - Ensure the project is active and the network matches (' +
                network +
                ')\n' +
                '   - Verify NEXT_PUBLIC_WEB3AUTH_CLIENT_ID in .env.local matches the dashboard\n' +
                '   - Check WEB3AUTH_NETWORK environment variable matches dashboard network'
            );

            // Retry logic for "Wallet is not ready yet" errors
            if (errorMessage.includes('Wallet is not ready yet') && attempt < maxRetries) {
              console.log(
                `Retrying Web3Auth initialization (attempt ${attempt + 1}/${maxRetries})...`
              );
              setTimeout(() => {
                init(attempt + 1);
              }, retryDelay * attempt); // Exponential backoff
              return;
            }
          }
        }
      } catch (error) {
        console.error('Web3Auth setup error:', error);
        // Retry on unexpected errors
        if (attempt < maxRetries) {
          console.log(
            `Retrying Web3Auth initialization after error (attempt ${attempt + 1}/${maxRetries})...`
          );
          setTimeout(() => {
            init(attempt + 1);
          }, retryDelay * attempt);
        }
      }
    };

    init();
  }, []);

  const connect = async () => {
    if (!web3auth) {
      console.error('[Web3Auth] Not initialized');
      return;
    }

    const startTime = performance.now();
    console.log('[Web3Auth] Initiating connection...');

    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      setLoggedIn(true);
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[Web3Auth] Connection successful (${duration}s)`);
    } catch (error) {
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.error(`[Web3Auth] Connection error (${duration}s):`, error);
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
      console.warn('[Balance] Provider not available');
      return '0';
    }

    const startTime = performance.now();
    const chainName = CHAIN_CONFIGS[currentChain].displayName;
    console.log(
      `[Balance] Fetching balance for address: ${address.slice(0, 6)}...${address.slice(-4)} on ${chainName}`
    );

    try {
      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[Balance] Balance fetched successfully (${duration}s):`, balance);
      return balance as string;
    } catch (error) {
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.error(`[Balance] Failed to get balance (${duration}s):`, error);
      return '0';
    }
  };

  const switchChain = async (chainId: ChainId) => {
    if (!web3auth || !provider) {
      console.error('[Web3Auth] Not initialized or not connected');
      return false;
    }

    const startTime = performance.now();
    console.log(`[Web3Auth] Switching to chain: ${chainId}`);

    try {
      const chainConfig = CHAIN_CONFIGS[chainId];

      // Request chain switch
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainConfig.chainId }],
      });

      setCurrentChain(chainId);
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[Web3Auth] Network switched successfully: ${chainId} (${duration}s)`);
      return true;
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      const error = switchError as { code?: number; message?: string };
      if (error.code === 4902) {
        console.log(`[Web3Auth] Chain not found, adding chain: ${chainId}`);
        try {
          const chainConfig = CHAIN_CONFIGS[chainId];
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainConfig.chainId,
                chainName: chainConfig.displayName,
                nativeCurrency: {
                  name: chainConfig.tickerName,
                  symbol: chainConfig.ticker,
                  decimals: 18,
                },
                rpcUrls: [chainConfig.rpcTarget],
                blockExplorerUrls: [chainConfig.blockExplorerUrl],
              },
            ],
          });
          setCurrentChain(chainId);
          const duration = ((performance.now() - startTime) / 1000).toFixed(2);
          console.log(
            `[Web3Auth] Chain added and switched successfully: ${chainId} (${duration}s)`
          );
          return true;
        } catch (addError) {
          console.error('[Web3Auth] Failed to add chain:', addError);
          return false;
        }
      }
      console.error('[Web3Auth] Failed to switch chain:', switchError);
      return false;
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        provider,
        loggedIn,
        currentChain,
        connect,
        disconnect,
        getUserInfo,
        getAccounts,
        getBalance,
        switchChain,
        chainConfigs: CHAIN_CONFIGS,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
}

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  provider: IProvider | null;
  loggedIn: boolean;
  currentChain: ChainId;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getUserInfo: () => Promise<unknown>;
  getAccounts: () => Promise<string[]>;
  getBalance: (address: string) => Promise<string>;
  switchChain: (chainId: ChainId) => Promise<boolean>;
  chainConfigs: typeof CHAIN_CONFIGS;
}

const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  provider: null,
  loggedIn: false,
  currentChain: 'ethereum',
  connect: async () => {},
  disconnect: async () => {},
  getUserInfo: async () => null,
  getAccounts: async () => [],
  getBalance: async () => '0',
  switchChain: async () => false,
  chainConfigs: CHAIN_CONFIGS,
});

export function useWeb3Auth() {
  return useContext(Web3AuthContext);
}
