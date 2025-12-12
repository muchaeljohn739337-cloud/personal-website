# Frontend Web3 Integration Guide

Complete examples for integrating Web3 wallet authentication into your frontend application.

## 📦 Required Dependencies

```bash
# React/Next.js project
npm install ethers axios

# Or with yarn
yarn add ethers axios
```

## 🔧 Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
# OR use Cloudflare Worker edge URL
NEXT_PUBLIC_WEB3_AUTH_URL=https://web3-auth-edge.your-domain.workers.dev
```

## 🎯 Complete React Hook

Create `hooks/useWeb3Auth.ts`:

```typescript
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Web3User {
  id: number;
  email: string;
  username: string;
  ethWalletAddress: string;
  role: string;
  createdAt: string;
}

interface UseWeb3AuthReturn {
  user: Web3User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  linkWallet: (userId: number) => Promise<void>;
  unlinkWallet: () => Promise<void>;
}

export function useWeb3Auth(): UseWeb3AuthReturn {
  const [user, setUser] = useState<Web3User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      loadUserStatus();
    }
  }, []);

  const loadUserStatus = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/web3/status`);
      setUser(data.user);
    } catch (err) {
      console.error("Failed to load user status:", err);
      localStorage.removeItem("authToken");
    }
  };

  const signIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
      }

      // Connect to wallet
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();

      console.log("🦊 Connected wallet:", walletAddress);

      // Request nonce
      const { data: nonceData } = await axios.post(`${API_URL}/api/auth/web3/nonce`, { walletAddress });

      console.log("🎲 Received nonce:", nonceData.nonce.slice(0, 10) + "...");

      // Sign message
      const signature = await signer.signMessage(nonceData.message);

      console.log("✍️ Message signed");

      // Verify signature
      const { data: authData } = await axios.post(`${API_URL}/api/auth/web3/verify`, {
        walletAddress,
        signature,
        message: nonceData.message,
      });

      console.log("✅ Authentication successful");

      // Store token
      localStorage.setItem("authToken", authData.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${authData.token}`;

      setUser(authData.user);
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      setError(err.response?.data?.error || err.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("authToken");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const linkWallet = async (userId: number) => {
    setLoading(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Request nonce
      const { data: nonceData } = await axios.post(`${API_URL}/api/auth/web3/nonce`, { walletAddress });

      // Sign message
      const signature = await signer.signMessage(nonceData.message);

      // Link wallet
      const { data } = await axios.post(`${API_URL}/api/auth/web3/link`, {
        userId,
        walletAddress,
        signature,
        message: nonceData.message,
      });

      console.log("✅ Wallet linked successfully");
      setUser(data.user);
    } catch (err: any) {
      console.error("Wallet linking failed:", err);
      setError(err.response?.data?.error || err.message || "Wallet linking failed");
    } finally {
      setLoading(false);
    }
  };

  const unlinkWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(`${API_URL}/api/auth/web3/unlink`);
      console.log("✅ Wallet unlinked");
      setUser(data.user);
    } catch (err: any) {
      console.error("Wallet unlinking failed:", err);
      setError(err.response?.data?.error || err.message || "Wallet unlinking failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    linkWallet,
    unlinkWallet,
  };
}
```

## 🎨 React Components

### Simple Login Button

```tsx
// components/Web3LoginButton.tsx
import { useWeb3Auth } from "../hooks/useWeb3Auth";

export function Web3LoginButton() {
  const { user, loading, error, signIn, signOut } = useWeb3Auth();

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <p className="font-medium">
            {user.ethWalletAddress.slice(0, 6)}...
            {user.ethWalletAddress.slice(-4)}
          </p>
          <p className="text-gray-500">{user.role}</p>
        </div>
        <button onClick={signOut} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={signIn}
        disabled={loading}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            Connecting...
          </>
        ) : (
          <>
            <span>🦊</span>
            Sign in with MetaMask
          </>
        )}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
```

### Full Login Page

```tsx
// pages/login.tsx or app/login/page.tsx
"use client";

import { useWeb3Auth } from "../hooks/useWeb3Auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loading, error, signIn } = useWeb3Auth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in with your crypto wallet</p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Connecting to MetaMask...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">🦊</span>
                <span>Sign in with MetaMask</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
            <p>Don't have MetaMask?</p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Download it here →
            </a>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Why Web3 Authentication?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>No passwords to remember or manage</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Cryptographically secure authentication</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Full control over your identity</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

### User Profile with Wallet Linking

```tsx
// components/WalletLinking.tsx
"use client";

import { useWeb3Auth } from "../hooks/useWeb3Auth";
import { useState } from "react";

interface WalletLinkingProps {
  userId: number;
  currentWallet?: string | null;
}

export function WalletLinking({ userId, currentWallet }: WalletLinkingProps) {
  const { loading, error, linkWallet, unlinkWallet } = useWeb3Auth();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Wallet Connection</h3>

      {currentWallet ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-md">
            <div>
              <p className="text-sm text-gray-600">Connected Wallet</p>
              <p className="font-mono text-sm font-medium">
                {currentWallet.slice(0, 10)}...{currentWallet.slice(-8)}
              </p>
            </div>
            <span className="text-green-500">✓</span>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Unlink Wallet
            </button>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 mb-3">
                Are you sure? You'll need to link a wallet again to access Web3 features.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await unlinkWallet();
                    setShowConfirm(false);
                  }}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Unlinking..." : "Yes, Unlink"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your Ethereum wallet to access Web3 features and enhanced security.
          </p>

          <button
            onClick={() => linkWallet(userId)}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Connecting...
              </>
            ) : (
              <>
                <span>🦊</span>
                Link MetaMask Wallet
              </>
            )}
          </button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}
    </div>
  );
}
```

## 🔐 Protected Routes

### Next.js Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("authToken")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
```

### React Route Guard

```tsx
// components/ProtectedRoute.tsx
import { useWeb3Auth } from "../hooks/useWeb3Auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useWeb3Auth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

## 📱 Mobile Wallet Support (WalletConnect)

```typescript
// hooks/useWalletConnect.ts
import { useState } from "react";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";

export function useWalletConnect() {
  const [provider, setProvider] = useState<any>(null);

  const connect = async () => {
    const wcProvider = new WalletConnectProvider({
      infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
    });

    await wcProvider.enable();

    const ethersProvider = new ethers.providers.Web3Provider(wcProvider);
    const signer = ethersProvider.getSigner();
    const address = await signer.getAddress();

    setProvider(ethersProvider);
    return { provider: ethersProvider, address };
  };

  return { provider, connect };
}
```

## ✅ Implementation Checklist

- [ ] Install dependencies (`ethers`, `axios`)
- [ ] Create `useWeb3Auth` hook
- [ ] Add Web3 login button component
- [ ] Create login page
- [ ] Implement protected routes
- [ ] Add wallet linking UI (optional)
- [ ] Test with MetaMask
- [ ] Add error handling
- [ ] Configure environment variables
- [ ] Deploy and test in production

## 🎉 You're Ready

Your frontend can now authenticate users with Web3 wallets using the backend API you've implemented.

Test it out with MetaMask installed! 🦊
