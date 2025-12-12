'use client';

import {
  Activity,
  AlertTriangle,
  Footprints,
  Heart,
  Moon,
  RefreshCw,
  Scale,
  Smile,
  Target,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HealthData {
  profile: {
    id: string;
    healthScore: number;
    lastScoreUpdate: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    height: number | null;
    bloodType: string | null;
    targetWeight: number | null;
    targetSteps: number;
    targetSleepHours: number;
    targetCalories: number | null;
  };
  recentReadings: Array<{
    id: string;
    heartRate: number | null;
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    oxygenSaturation: number | null;
    temperature: number | null;
    steps: number | null;
    sleepHours: number | null;
    sleepQuality: string | null;
    weight: number | null;
    mood: string | null;
    recordedAt: string;
  }>;
  activeGoals: Array<{
    id: string;
    type: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    status: string;
  }>;
  unacknowledgedAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
  stats: {
    avgHeartRate: number;
    avgSleepHours: number;
    avgSteps: number;
    avgOxygen: number;
    totalSteps: number;
    totalCalories: number;
    totalActiveMinutes: number;
    readingCount: number;
  } | null;
}

const moodEmojis: Record<string, string> = {
  GREAT: '😄',
  GOOD: '🙂',
  OKAY: '😐',
  BAD: '😔',
  TERRIBLE: '😢',
};

export function HealthDashboard() {
  const [data, setData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error('Failed to fetch health data');
      const healthData = await response.json();
      setData(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500">{error || 'Failed to load health data'}</p>
          <Button variant="outline" onClick={fetchHealth} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { profile, recentReadings, activeGoals, unacknowledgedAlerts, stats } = data;
  const latestReading = recentReadings && recentReadings.length > 0 ? recentReadings[0] : null;

  // Calculate health score color
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
              Health Alerts ({unacknowledgedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unacknowledgedAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-lg p-3 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-100 dark:bg-red-950'
                      : alert.severity === 'WARNING'
                        ? 'bg-amber-100 dark:bg-amber-900'
                        : 'bg-blue-100 dark:bg-blue-950'
                  }`}
                >
                  <AlertTriangle
                    className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'CRITICAL'
                        ? 'text-red-600'
                        : alert.severity === 'WARNING'
                          ? 'text-amber-600'
                          : 'text-blue-600'
                    }`}
                  />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Score */}
      <Card
        className={`overflow-hidden bg-gradient-to-br ${getScoreGradient(profile.healthScore)}`}
      >
        <CardContent className="p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Health Score</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-6xl font-bold">{profile.healthScore}</span>
                <span className="text-2xl font-medium text-white/80">/100</span>
              </div>
              <p className="mt-1 text-sm text-white/70">
                {profile.healthScore >= 80
                  ? 'Excellent! Keep it up!'
                  : profile.healthScore >= 60
                    ? 'Good progress, room for improvement'
                    : 'Focus on your health goals'}
              </p>
            </div>
            <div className="rounded-full bg-white/20 p-4">
              <Activity className="h-12 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-950">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {latestReading?.heartRate || stats?.avgHeartRate || '--'}
              </p>
              <p className="text-sm text-slate-500">Heart Rate (BPM)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
              <Footprints className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {latestReading?.steps?.toLocaleString() ||
                  stats?.avgSteps?.toLocaleString() ||
                  '--'}
              </p>
              <p className="text-sm text-slate-500">Steps Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950">
              <Moon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {latestReading?.sleepHours || stats?.avgSleepHours || '--'}h
              </p>
              <p className="text-sm text-slate-500">Sleep</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-cyan-100 p-3 dark:bg-cyan-950">
              <Wind className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {latestReading?.oxygenSaturation || stats?.avgOxygen || '--'}%
              </p>
              <p className="text-sm text-slate-500">Oxygen (SpO2)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Goals
            </CardTitle>
            <CardDescription>Track your health objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const progress = Math.min(
                  100,
                  (Number(goal.currentValue) / Number(goal.targetValue)) * 100
                );
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{goal.type.replace(/_/g, ' ')}</span>
                      <span className="text-slate-500">
                        {Number(goal.currentValue).toLocaleString()} /{' '}
                        {Number(goal.targetValue).toLocaleString()} {goal.unit}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full transition-all ${
                          progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Readings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Readings</CardTitle>
          <CardDescription>Your latest health measurements</CardDescription>
        </CardHeader>
        <CardContent>
          {recentReadings.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-500">No readings recorded yet</p>
              <Button variant="outline" className="mt-4">
                Record First Reading
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReadings.slice(0, 5).map((reading) => (
                <div
                  key={reading.id}
                  className="flex items-center justify-between rounded-lg border p-4 dark:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500">
                      {new Date(reading.recordedAt).toLocaleDateString()}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {reading.heartRate && (
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>{reading.heartRate} bpm</span>
                        </div>
                      )}
                      {reading.steps && (
                        <div className="flex items-center gap-1">
                          <Footprints className="h-4 w-4 text-blue-500" />
                          <span>{reading.steps.toLocaleString()}</span>
                        </div>
                      )}
                      {reading.sleepHours && (
                        <div className="flex items-center gap-1">
                          <Moon className="h-4 w-4 text-purple-500" />
                          <span>{reading.sleepHours}h</span>
                        </div>
                      )}
                      {reading.weight && (
                        <div className="flex items-center gap-1">
                          <Scale className="h-4 w-4 text-slate-500" />
                          <span>{reading.weight}kg</span>
                        </div>
                      )}
                      {reading.temperature && (
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          <span>{reading.temperature}°C</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {reading.mood && (
                    <div className="flex items-center gap-1">
                      <Smile className="h-4 w-4 text-yellow-500" />
                      <span>{moodEmojis[reading.mood] || reading.mood}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Stats */}
      {stats && stats.readingCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>7-Day Summary</CardTitle>
            <CardDescription>Your weekly health averages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Avg Heart Rate</p>
                <p className="text-2xl font-bold">{stats.avgHeartRate || '--'} BPM</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Avg Sleep</p>
                <p className="text-2xl font-bold">{stats.avgSleepHours || '--'} hours</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Total Steps</p>
                <p className="text-2xl font-bold">{stats.totalSteps.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Active Minutes</p>
                <p className="text-2xl font-bold">{stats.totalActiveMinutes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
