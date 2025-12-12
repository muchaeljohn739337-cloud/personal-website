/**
 * Alchemy Web3 API Integration
 * Real blockchain data fetching using Alchemy SDK
 */

import { Network, Alchemy } from 'alchemy-sdk';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  console.warn('ALCHEMY_API_KEY not configured - blockchain features will use mock data');
}

// Initialize Alchemy instances for different networks
const alchemyInstances = {
  ethereum: ALCHEMY_API_KEY
    ? new Alchemy({
        apiKey: ALCHEMY_API_KEY,
        network: Network.ETH_MAINNET,
      })
    : null,
  polygon: ALCHEMY_API_KEY
    ? new Alchemy({
        apiKey: ALCHEMY_API_KEY,
        network: Network.MATIC_MAINNET,
      })
    : null,
  arbitrum: ALCHEMY_API_KEY
    ? new Alchemy({
        apiKey: ALCHEMY_API_KEY,
        network: Network.ARB_MAINNET,
      })
    : null,
  base: ALCHEMY_API_KEY
    ? new Alchemy({
        apiKey: ALCHEMY_API_KEY,
        network: Network.BASE_MAINNET,
      })
    : null,
};

export type SupportedNetwork = keyof typeof alchemyInstances;

/**
 * Get wallet balance for a specific address and network
 */
export async function getWalletBalance(address: string, network: SupportedNetwork = 'ethereum') {
  const alchemy = alchemyInstances[network];

  if (!alchemy) {
    console.warn('Alchemy not configured, returning mock balance');
    return {
      balance: '0',
      balanceUSD: 0,
      network,
    };
  }

  try {
    // Get native token balance (ETH, MATIC, etc.)
    const balance = await alchemy.core.getBalance(address);
    const balanceInEth = parseFloat(balance.toString()) / 1e18;

    // Get USD price (simplified - you'd want to use a price oracle)
    const priceUSD = await getTokenPriceUSD(network);
    const balanceUSD = balanceInEth * priceUSD;

    return {
      balance: balanceInEth.toFixed(6),
      balanceUSD: parseFloat(balanceUSD.toFixed(2)),
      network,
    };
  } catch (error) {
    console.error(`Error fetching balance for ${network}:`, error);
    return {
      balance: '0',
      balanceUSD: 0,
      network,
    };
  }
}

/**
 * Get token balances (ERC-20) for a wallet
 */
export async function getTokenBalances(address: string, network: SupportedNetwork = 'ethereum') {
  const alchemy = alchemyInstances[network];

  if (!alchemy) {
    return [];
  }

  try {
    const balances = await alchemy.core.getTokenBalances(address);

    // Filter out zero balances and get metadata
    const tokens = await Promise.all(
      balances.tokenBalances
        .filter((token) => token.tokenBalance !== '0')
        .map(async (token) => {
          const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
          const balance =
            parseInt(token.tokenBalance || '0') / Math.pow(10, metadata.decimals || 18);

          return {
            address: token.contractAddress,
            symbol: metadata.symbol || 'UNKNOWN',
            name: metadata.name || 'Unknown Token',
            balance: balance.toFixed(6),
            decimals: metadata.decimals || 18,
            logo: metadata.logo,
          };
        })
    );

    return tokens;
  } catch (error) {
    console.error(`Error fetching token balances for ${network}:`, error);
    return [];
  }
}

/**
 * Get transaction history for a wallet
 */
export async function getTransactionHistory(
  address: string,
  network: SupportedNetwork = 'ethereum',
  limit: number = 10
) {
  const alchemy = alchemyInstances[network];

  if (!alchemy) {
    return [];
  }

  try {
    const transactions = await alchemy.core.getAssetTransfers({
      fromAddress: address,
      category: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'external' as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'internal' as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'erc20' as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'erc721' as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'erc1155' as any,
      ],
      maxCount: limit,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      order: 'desc' as any,
    });

    return transactions.transfers.map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to || '',
      value: tx.value?.toString() || '0',
      asset: tx.asset || 'ETH',
      category: tx.category,
      blockNum: tx.blockNum,
      timestamp: (tx as { metadata?: { blockTimestamp?: string } }).metadata?.blockTimestamp,
    }));
  } catch (error) {
    console.error(`Error fetching transaction history for ${network}:`, error);
    return [];
  }
}

/**
 * Get NFTs owned by a wallet
 */
export async function getNFTs(address: string, network: SupportedNetwork = 'ethereum') {
  const alchemy = alchemyInstances[network];

  if (!alchemy) {
    return [];
  }

  try {
    const nfts = await alchemy.nft.getNftsForOwner(address);

    return nfts.ownedNfts.map((nft) => ({
      contractAddress: nft.contract.address,
      tokenId: nft.tokenId,
      name: nft.name || nft.contract.name || 'Unknown NFT',
      description: nft.description,
      image: nft.image?.originalUrl || nft.image?.cachedUrl,
      collection: nft.contract.name,
    }));
  } catch (error) {
    console.error(`Error fetching NFTs for ${network}:`, error);
    return [];
  }
}

/**
 * Get current gas price
 */
export async function getGasPrice(network: SupportedNetwork = 'ethereum') {
  const alchemy = alchemyInstances[network];

  if (!alchemy) {
    return {
      gasPrice: '0',
      maxFeePerGas: '0',
      maxPriorityFeePerGas: '0',
    };
  }

  try {
    const feeData = await alchemy.core.getFeeData();

    return {
      gasPrice: feeData.gasPrice?.toString() || '0',
      maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || '0',
    };
  } catch (error) {
    console.error(`Error fetching gas price for ${network}:`, error);
    return {
      gasPrice: '0',
      maxFeePerGas: '0',
      maxPriorityFeePerGas: '0',
    };
  }
}

/**
 * Verify a transaction hash
 */
export async function verifyTransaction(txHash: string, network: SupportedNetwork = 'ethereum') {
  const alchemy = alchemyInstances[network];

  if (!alchemy) {
    return null;
  }

  try {
    const transaction = await alchemy.core.getTransaction(txHash);
    const receipt = await alchemy.core.getTransactionReceipt(txHash);

    return {
      hash: transaction?.hash,
      from: transaction?.from,
      to: transaction?.to,
      value: transaction?.value?.toString(),
      status: receipt?.status === 1 ? 'success' : 'failed',
      blockNumber: receipt?.blockNumber,
      confirmations: receipt?.confirmations,
      gasUsed: receipt?.gasUsed?.toString(),
    };
  } catch (error) {
    console.error(`Error verifying transaction ${txHash}:`, error);
    return null;
  }
}

/**
 * Get token price in USD (simplified - uses CoinGecko API)
 */
async function getTokenPriceUSD(network: SupportedNetwork): Promise<number> {
  const tokenIds: Record<SupportedNetwork, string> = {
    ethereum: 'ethereum',
    polygon: 'matic-network',
    arbitrum: 'ethereum', // ARB uses ETH
    base: 'ethereum', // Base uses ETH
  };

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds[network]}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[tokenIds[network]]?.usd || 0;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return 0;
  }
}

/**
 * Get network statistics
 */
export async function getNetworkStats(network: SupportedNetwork = 'ethereum') {
  const alchemy = alchemyInstances[network];

  if (!alchemy) {
    return {
      blockNumber: 0,
      gasPrice: '0',
      network,
    };
  }

  try {
    const [blockNumber, feeData] = await Promise.all([
      alchemy.core.getBlockNumber(),
      alchemy.core.getFeeData(),
    ]);

    return {
      blockNumber,
      gasPrice: feeData.gasPrice?.toString() || '0',
      network,
    };
  } catch (error) {
    console.error(`Error fetching network stats for ${network}:`, error);
    return {
      blockNumber: 0,
      gasPrice: '0',
      network,
    };
  }
}

/**
 * Check if Alchemy is configured
 */
export function isAlchemyConfigured(): boolean {
  return !!ALCHEMY_API_KEY;
}
