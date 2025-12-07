'use client';

import {
  Check,
  Clock,
  Copy,
  CreditCard,
  Globe,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Smartphone,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VerificationService {
  id: string;
  name: string;
  shortName: string;
  category: string;
}

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface Verification {
  id: string;
  orderId: string;
  number: string;
  country: string;
  service: string;
  serviceName: string;
  status: string;
  code?: string;
  message?: string;
  rentedAt: string;
  expiresAt: string;
  cost: number;
}

interface Stats {
  active: number;
  received: number;
  expired: number;
  cancelled: number;
  totalSpent: number;
}

export default function VerificationPage() {
  const [services, setServices] = useState<VerificationService[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [activeVerifications, setActiveVerifications] = useState<Verification[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [renting, setRenting] = useState(false);

  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/communications/verification');
      const data = await res.json();
      setServices(data.services || []);
      setCountries(data.countries || []);
      setActiveVerifications(data.active || []);
      setStats(data.stats);
      setBalance(data.balance?.balance || 0);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll for code updates
    const interval = setInterval(() => {
      if (activeVerifications.some((v) => v.status === 'waiting')) {
        checkAllCodes();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData, activeVerifications]);

  const checkAllCodes = async () => {
    for (const ver of activeVerifications) {
      if (ver.status === 'waiting') {
        await fetch('/api/communications/verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check', verificationId: ver.id }),
        });
      }
    }
    await fetchData();
  };

  const rentNumber = async () => {
    if (!selectedService || !selectedCountry) return;

    setRenting(true);
    try {
      const res = await fetch('/api/communications/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rent',
          country: selectedCountry,
          service: selectedService,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        setSelectedService('');
      } else {
        alert(data.error || 'Failed to rent number');
      }
    } catch (error) {
      console.error('Rent error:', error);
    } finally {
      setRenting(false);
    }
  };

  const cancelVerification = async (id: string) => {
    try {
      await fetch('/api/communications/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', verificationId: id }),
      });
      await fetchData();
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'social', 'messaging', 'email', 'finance', 'shopping', 'other'];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
            <Smartphone className="h-8 w-8 text-blue-500" />
            SMS Verification
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Rent virtual numbers for social media & app verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 dark:bg-green-900/30">
            <CreditCard className="h-4 w-4 text-green-600" />
            <span className="font-bold text-green-700 dark:text-green-400">
              ${balance.toFixed(2)}
            </span>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.active || 0}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.received || 0}</p>
                <p className="text-sm text-slate-500">Received</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.expired || 0}</p>
                <p className="text-sm text-slate-500">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <X className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.cancelled || 0}</p>
                <p className="text-sm text-slate-500">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats?.totalSpent.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-slate-500">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Verifications */}
      {activeVerifications.length > 0 && (
        <Card className="border-2 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Active Verifications
            </CardTitle>
            <CardDescription>Waiting for SMS codes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeVerifications.map((ver) => (
                <div
                  key={ver.id}
                  className={`rounded-lg border p-4 ${
                    ver.status === 'received'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{ver.serviceName}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            ver.status === 'received'
                              ? 'bg-green-100 text-green-700'
                              : ver.status === 'waiting'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {ver.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {ver.number}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {ver.country}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {ver.status === 'received' && ver.code && (
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-green-500 px-4 py-2 font-mono text-xl font-bold text-white">
                            {ver.code}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(ver.code!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {ver.status === 'waiting' && (
                        <>
                          <div className="flex items-center gap-2 text-blue-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Waiting for code...</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelVerification(ver.id)}
                            className="text-red-500"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {ver.message && (
                    <div className="mt-3 rounded bg-slate-100 p-2 text-sm dark:bg-slate-800">
                      <span className="font-medium">Full SMS:</span> {ver.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rent New Number */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Country Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              Select Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setSelectedCountry(country.code)}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition-all ${
                    selectedCountry === country.code
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="truncate">{country.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              Select Service
            </CardTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              {/* Categories */}
              <div className="flex gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium capitalize ${
                      selectedCategory === cat
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    selectedService === service.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-medium text-sm">{service.name}</p>
                  <p className="text-xs text-slate-500">{service.category}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rent Button */}
      <Card className="border-2 border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Ready to Rent</h3>
              <p className="text-sm text-slate-500">
                {selectedService && selectedCountry
                  ? `${services.find((s) => s.id === selectedService)?.name || selectedService} - ${countries.find((c) => c.code === selectedCountry)?.name || selectedCountry}`
                  : 'Select a country and service above'}
              </p>
            </div>
            <Button
              onClick={rentNumber}
              disabled={!selectedService || !selectedCountry || renting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {renting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Phone className="mr-2 h-4 w-4" />
              )}
              Rent Number
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
