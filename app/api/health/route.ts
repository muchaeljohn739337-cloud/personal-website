import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getOrCreateHealthProfile, getHealthStats } from '@/lib/health';

// GET /api/health - Get user's health profile and stats
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateHealthProfile(session.user.id);
    const stats = await getHealthStats(session.user.id, 7);

    return NextResponse.json({
      profile: {
        id: profile.id,
        healthScore: profile.healthScore,
        lastScoreUpdate: profile.lastScoreUpdate,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        height: profile.height ? Number(profile.height) : null,
        bloodType: profile.bloodType,
        targetWeight: profile.targetWeight ? Number(profile.targetWeight) : null,
        targetSteps: profile.targetSteps,
        targetSleepHours: Number(profile.targetSleepHours),
        targetCalories: profile.targetCalories,
      },
      recentReadings: profile.readings.map((r) => ({
        ...r,
        oxygenSaturation: r.oxygenSaturation ? Number(r.oxygenSaturation) : null,
        temperature: r.temperature ? Number(r.temperature) : null,
        sleepHours: r.sleepHours ? Number(r.sleepHours) : null,
        weight: r.weight ? Number(r.weight) : null,
        bodyFat: r.bodyFat ? Number(r.bodyFat) : null,
        distance: r.distance ? Number(r.distance) : null,
      })),
      activeGoals: profile.goals,
      unacknowledgedAlerts: profile.alerts,
      stats,
    });
  } catch (error) {
    console.error('Health profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch health profile' }, { status: 500 });
  }
}
