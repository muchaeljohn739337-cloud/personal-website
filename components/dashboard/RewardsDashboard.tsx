'use client';

import {
  Award,
  Calendar,
  CheckCircle,
  Crown,
  Flame,
  Gift,
  RefreshCw,
  Star,
  Trophy,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RewardsData {
  profile: {
    totalPoints: number;
    currentTier: string;
    tierMultiplier: number;
    currentStreak: number;
    longestStreak: number;
    lastCheckIn: string | null;
    totalRewardsClaimed: number;
    totalAchievements: number;
  };
  tierConfig: Record<string, { points: number; multiplier: number; name: string }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string | null;
    category: string;
    requirement: number;
    pointsReward: number;
    tokenReward: number;
    progress: number;
    completed: boolean;
    claimed: boolean;
  }>;
  availableRewards: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    tokenAmount: number;
    pointsAmount: number;
    requiredTier: string | null;
    requiredPoints: number;
  }>;
}

const tierIcons: Record<string, typeof Crown> = {
  BRONZE: Award,
  SILVER: Star,
  GOLD: Trophy,
  PLATINUM: Crown,
  DIAMOND: Crown,
};

const tierColors: Record<string, string> = {
  BRONZE: 'from-amber-600 to-amber-800',
  SILVER: 'from-slate-400 to-slate-600',
  GOLD: 'from-yellow-400 to-yellow-600',
  PLATINUM: 'from-cyan-400 to-cyan-600',
  DIAMOND: 'from-purple-400 to-pink-500',
};

export function RewardsDashboard() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rewards');
      if (!response.ok) throw new Error('Failed to fetch rewards');
      const rewardsData = await response.json();
      setData(rewardsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true);
      const response = await fetch('/api/rewards/checkin', { method: 'POST' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Check-in failed');
      }

      // Refresh data
      await fetchRewards();
      alert(`${result.message}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setIsCheckingIn(false);
    }
  };

  useEffect(() => {
    fetchRewards();
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
          <p className="text-red-500">{error || 'Failed to load rewards'}</p>
          <Button variant="outline" onClick={fetchRewards} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { profile, tierConfig, achievements } = data;
  const TierIcon = tierIcons[profile.currentTier] || Award;
  const tierColor = tierColors[profile.currentTier] || tierColors.BRONZE;

  // Calculate progress to next tier
  const tiers = Object.entries(tierConfig).sort((a, b) => a[1].points - b[1].points);
  const currentTierIndex = tiers.findIndex(([key]) => key === profile.currentTier);
  const nextTier = tiers[currentTierIndex + 1];
  const progressToNextTier = nextTier
    ? Math.min(100, ((profile.totalPoints - tierConfig[profile.currentTier].points) /
        (nextTier[1].points - tierConfig[profile.currentTier].points)) * 100)
    : 100;

  // Check if can check in today
  const canCheckIn = !profile.lastCheckIn || 
    new Date(profile.lastCheckIn).toDateString() !== new Date().toDateString();

  return (
    <div className="space-y-6">
      {/* Tier Card */}
      <Card className={`overflow-hidden bg-gradient-to-br ${tierColor}`}>
        <CardContent className="p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Current Tier</p>
              <div className="mt-2 flex items-center gap-3">
                <TierIcon className="h-10 w-10" />
                <div>
                  <h2 className="text-3xl font-bold">{tierConfig[profile.currentTier]?.name}</h2>
                  <p className="text-sm text-white/80">
                    {profile.tierMultiplier}x reward multiplier
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{profile.totalPoints.toLocaleString()}</p>
              <p className="text-sm text-white/80">Total Points</p>
            </div>
          </div>

          {nextTier && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-white/80">
                <span>Progress to {nextTier[1].name}</span>
                <span>{nextTier[1].points - profile.totalPoints} points needed</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${progressToNextTier}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streak & Check-in */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              Daily Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-orange-500">{profile.currentStreak}</p>
                <p className="text-sm text-slate-500">Current streak</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-slate-600">{profile.longestStreak}</p>
                <p className="text-sm text-slate-500">Best streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
              Daily Check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCheckIn}
              disabled={!canCheckIn || isCheckingIn}
              className="w-full"
              variant={canCheckIn ? 'default' : 'outline'}
            >
              {isCheckingIn ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : canCheckIn ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
              )}
              {canCheckIn ? 'Check In Now' : 'Checked In Today!'}
            </Button>
            <p className="mt-2 text-center text-xs text-slate-500">
              {canCheckIn
                ? `Earn ${10 * (profile.currentStreak + 1)} tokens for day ${profile.currentStreak + 1}`
                : 'Come back tomorrow for more rewards!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile.totalAchievements}</p>
              <p className="text-sm text-slate-500">Achievements</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950">
              <Gift className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile.totalRewardsClaimed}</p>
              <p className="text-sm text-slate-500">Rewards Claimed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile.tierMultiplier}x</p>
              <p className="text-sm text-slate-500">Multiplier</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Complete challenges to earn rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {achievements.slice(0, 6).map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center gap-4 rounded-lg border p-4 ${
                  achievement.completed
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    achievement.completed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {achievement.completed ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Trophy className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{achievement.name}</h4>
                  <p className="text-sm text-slate-500">{achievement.description}</p>
                  {!achievement.completed && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.requirement}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{
                            width: `${(achievement.progress / achievement.requirement) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {achievement.completed && !achievement.claimed && (
                  <Button size="sm" variant="outline">
                    Claim
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
