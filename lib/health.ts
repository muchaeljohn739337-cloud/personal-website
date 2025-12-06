import { prisma } from './prismaClient';

// Health score calculation weights
const HEALTH_WEIGHTS = {
  heartRate: 10,
  sleep: 10,
  steps: 10,
  oxygen: 10,
  bloodPressure: 10,
};

// Get or create health profile
export async function getOrCreateHealthProfile(userId: string) {
  let profile = await prisma.healthProfile.findUnique({
    where: { userId },
    include: {
      readings: {
        orderBy: { recordedAt: 'desc' },
        take: 10,
      },
      goals: {
        where: { status: 'ACTIVE' },
      },
      alerts: {
        where: { acknowledged: false },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!profile) {
    profile = await prisma.healthProfile.create({
      data: { userId },
      include: {
        readings: true,
        goals: true,
        alerts: true,
      },
    });
  }

  return profile;
}

// Record a health reading
export async function recordHealthReading(
  userId: string,
  data: {
    heartRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    oxygenSaturation?: number;
    temperature?: number;
    steps?: number;
    caloriesBurned?: number;
    activeMinutes?: number;
    distance?: number;
    sleepHours?: number;
    sleepQuality?: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
    weight?: number;
    bodyFat?: number;
    mood?: 'GREAT' | 'GOOD' | 'OKAY' | 'BAD' | 'TERRIBLE';
    stressLevel?: number;
    source?: string;
    deviceId?: string;
    notes?: string;
  }
) {
  const profile = await getOrCreateHealthProfile(userId);

  const reading = await prisma.healthReading.create({
    data: {
      profileId: profile.id,
      heartRate: data.heartRate,
      bloodPressureSystolic: data.bloodPressureSystolic,
      bloodPressureDiastolic: data.bloodPressureDiastolic,
      oxygenSaturation: data.oxygenSaturation,
      temperature: data.temperature,
      steps: data.steps,
      caloriesBurned: data.caloriesBurned,
      activeMinutes: data.activeMinutes,
      distance: data.distance,
      sleepHours: data.sleepHours,
      sleepQuality: data.sleepQuality,
      weight: data.weight,
      bodyFat: data.bodyFat,
      mood: data.mood,
      stressLevel: data.stressLevel,
      source: (data.source as never) || 'MANUAL',
      deviceId: data.deviceId,
      notes: data.notes,
    },
  });

  // Check for alerts
  await checkHealthAlerts(profile.id, reading);

  // Update health score
  await updateHealthScore(userId);

  // Update goal progress
  await updateGoalProgress(userId, data);

  return reading;
}

// Check for health alerts based on reading
async function checkHealthAlerts(
  profileId: string,
  reading: {
    heartRate?: number | null;
    bloodPressureSystolic?: number | null;
    bloodPressureDiastolic?: number | null;
    oxygenSaturation?: number | null;
    temperature?: number | null;
  }
) {
  const alerts: Array<{
    type: string;
    severity: string;
    title: string;
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }> = [];

  // Heart rate alerts
  if (reading.heartRate) {
    if (reading.heartRate > 100) {
      alerts.push({
        type: 'HIGH_HEART_RATE',
        severity: reading.heartRate > 120 ? 'CRITICAL' : 'WARNING',
        title: 'High Heart Rate Detected',
        message: `Your heart rate of ${reading.heartRate} BPM is above normal range.`,
        metric: 'heartRate',
        value: reading.heartRate,
        threshold: 100,
      });
    } else if (reading.heartRate < 50) {
      alerts.push({
        type: 'LOW_HEART_RATE',
        severity: reading.heartRate < 40 ? 'CRITICAL' : 'WARNING',
        title: 'Low Heart Rate Detected',
        message: `Your heart rate of ${reading.heartRate} BPM is below normal range.`,
        metric: 'heartRate',
        value: reading.heartRate,
        threshold: 50,
      });
    }
  }

  // Blood pressure alerts
  if (reading.bloodPressureSystolic && reading.bloodPressureDiastolic) {
    if (reading.bloodPressureSystolic > 140 || reading.bloodPressureDiastolic > 90) {
      alerts.push({
        type: 'HIGH_BLOOD_PRESSURE',
        severity: reading.bloodPressureSystolic > 180 ? 'CRITICAL' : 'WARNING',
        title: 'High Blood Pressure Detected',
        message: `Your blood pressure of ${reading.bloodPressureSystolic}/${reading.bloodPressureDiastolic} mmHg is elevated.`,
        metric: 'bloodPressure',
        value: reading.bloodPressureSystolic,
        threshold: 140,
      });
    }
  }

  // Oxygen saturation alerts
  if (reading.oxygenSaturation) {
    const oxygenValue = Number(reading.oxygenSaturation);
    if (oxygenValue < 95) {
      alerts.push({
        type: 'LOW_OXYGEN',
        severity: oxygenValue < 90 ? 'CRITICAL' : 'WARNING',
        title: 'Low Oxygen Saturation',
        message: `Your oxygen saturation of ${oxygenValue}% is below normal.`,
        metric: 'oxygenSaturation',
        value: oxygenValue,
        threshold: 95,
      });
    }
  }

  // Temperature alerts
  if (reading.temperature) {
    const tempValue = Number(reading.temperature);
    if (tempValue > 37.5) {
      alerts.push({
        type: 'HIGH_TEMPERATURE',
        severity: tempValue > 39 ? 'CRITICAL' : 'WARNING',
        title: 'Elevated Temperature',
        message: `Your temperature of ${tempValue}°C indicates a possible fever.`,
        metric: 'temperature',
        value: tempValue,
        threshold: 37.5,
      });
    }
  }

  // Create alerts in database
  for (const alert of alerts) {
    await prisma.healthAlert.create({
      data: {
        profileId,
        type: alert.type as never,
        severity: alert.severity as never,
        title: alert.title,
        message: alert.message,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
      },
    });
  }

  return alerts;
}

// Calculate and update health score
export async function updateHealthScore(userId: string) {
  const profile = await prisma.healthProfile.findUnique({
    where: { userId },
    include: {
      readings: {
        orderBy: { recordedAt: 'desc' },
        take: 7, // Last 7 readings
      },
    },
  });

  if (!profile || profile.readings.length === 0) {
    return 70; // Default score
  }

  let score = 70; // Base score
  const latestReading = profile.readings[0];

  // Heart rate bonus (60-80 BPM is optimal)
  if (latestReading.heartRate) {
    if (latestReading.heartRate >= 60 && latestReading.heartRate <= 80) {
      score += HEALTH_WEIGHTS.heartRate;
    } else if (latestReading.heartRate >= 50 && latestReading.heartRate <= 100) {
      score += HEALTH_WEIGHTS.heartRate / 2;
    }
  }

  // Sleep bonus (7-9 hours is optimal)
  if (latestReading.sleepHours) {
    const sleepHours = Number(latestReading.sleepHours);
    if (sleepHours >= 7 && sleepHours <= 9) {
      score += HEALTH_WEIGHTS.sleep;
    } else if (sleepHours >= 6 && sleepHours <= 10) {
      score += HEALTH_WEIGHTS.sleep / 2;
    }
  }

  // Steps bonus (8000+ is good)
  if (latestReading.steps) {
    if (latestReading.steps >= 10000) {
      score += HEALTH_WEIGHTS.steps;
    } else if (latestReading.steps >= 8000) {
      score += HEALTH_WEIGHTS.steps * 0.8;
    } else if (latestReading.steps >= 5000) {
      score += HEALTH_WEIGHTS.steps * 0.5;
    }
  }

  // Oxygen bonus (95%+ is normal)
  if (latestReading.oxygenSaturation) {
    const oxygen = Number(latestReading.oxygenSaturation);
    if (oxygen >= 98) {
      score += HEALTH_WEIGHTS.oxygen;
    } else if (oxygen >= 95) {
      score += HEALTH_WEIGHTS.oxygen * 0.7;
    }
  }

  // Cap score at 100
  score = Math.min(100, Math.round(score));

  // Update profile
  await prisma.healthProfile.update({
    where: { userId },
    data: {
      healthScore: score,
      lastScoreUpdate: new Date(),
    },
  });

  return score;
}

// Update goal progress based on reading
async function updateGoalProgress(
  userId: string,
  data: {
    steps?: number;
    sleepHours?: number;
    weight?: number;
    caloriesBurned?: number;
    activeMinutes?: number;
  }
) {
  const profile = await prisma.healthProfile.findUnique({
    where: { userId },
    include: {
      goals: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (!profile) return;

  for (const goal of profile.goals) {
    let newValue = Number(goal.currentValue);

    switch (goal.type) {
      case 'STEPS':
        if (data.steps) newValue = data.steps;
        break;
      case 'SLEEP':
        if (data.sleepHours) newValue = data.sleepHours;
        break;
      case 'WEIGHT_LOSS':
      case 'WEIGHT_GAIN':
        if (data.weight) newValue = data.weight;
        break;
      case 'CALORIES':
        if (data.caloriesBurned) newValue += data.caloriesBurned;
        break;
      case 'EXERCISE_MINUTES':
        if (data.activeMinutes) newValue += data.activeMinutes;
        break;
    }

    const targetValue = Number(goal.targetValue);
    const completed =
      goal.type === 'WEIGHT_LOSS'
        ? newValue <= targetValue
        : newValue >= targetValue;

    await prisma.healthGoal.update({
      where: { id: goal.id },
      data: {
        currentValue: newValue,
        status: completed ? 'COMPLETED' : 'ACTIVE',
        completedAt: completed ? new Date() : null,
      },
    });

    // Create alert for completed goal
    if (completed) {
      await prisma.healthAlert.create({
        data: {
          profileId: profile.id,
          type: 'GOAL_ACHIEVED',
          severity: 'INFO',
          title: 'Goal Achieved!',
          message: `Congratulations! You've completed your ${goal.type.toLowerCase().replace('_', ' ')} goal.`,
          metric: goal.type,
          value: newValue,
          threshold: targetValue,
        },
      });
    }
  }
}

// Create a health goal
export async function createHealthGoal(
  userId: string,
  data: {
    type: string;
    targetValue: number;
    unit: string;
    endDate?: Date;
    tokenReward?: number;
    pointsReward?: number;
  }
) {
  const profile = await getOrCreateHealthProfile(userId);

  const goal = await prisma.healthGoal.create({
    data: {
      profileId: profile.id,
      type: data.type as never,
      targetValue: data.targetValue,
      unit: data.unit,
      startDate: new Date(),
      endDate: data.endDate,
      tokenReward: data.tokenReward || 0,
      pointsReward: data.pointsReward || 0,
    },
  });

  return goal;
}

// Get health statistics
export async function getHealthStats(userId: string, days: number = 7) {
  const profile = await prisma.healthProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return null;
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const readings = await prisma.healthReading.findMany({
    where: {
      profileId: profile.id,
      recordedAt: { gte: startDate },
    },
    orderBy: { recordedAt: 'asc' },
  });

  // Calculate averages
  const stats = {
    avgHeartRate: 0,
    avgSleepHours: 0,
    avgSteps: 0,
    avgOxygen: 0,
    totalSteps: 0,
    totalCalories: 0,
    totalActiveMinutes: 0,
    readingCount: readings.length,
  };

  let heartRateCount = 0;
  let sleepCount = 0;
  let stepsCount = 0;
  let oxygenCount = 0;

  for (const reading of readings) {
    if (reading.heartRate) {
      stats.avgHeartRate += reading.heartRate;
      heartRateCount++;
    }
    if (reading.sleepHours) {
      stats.avgSleepHours += Number(reading.sleepHours);
      sleepCount++;
    }
    if (reading.steps) {
      stats.avgSteps += reading.steps;
      stats.totalSteps += reading.steps;
      stepsCount++;
    }
    if (reading.oxygenSaturation) {
      stats.avgOxygen += Number(reading.oxygenSaturation);
      oxygenCount++;
    }
    if (reading.caloriesBurned) {
      stats.totalCalories += reading.caloriesBurned;
    }
    if (reading.activeMinutes) {
      stats.totalActiveMinutes += reading.activeMinutes;
    }
  }

  if (heartRateCount > 0) stats.avgHeartRate = Math.round(stats.avgHeartRate / heartRateCount);
  if (sleepCount > 0) stats.avgSleepHours = Math.round(stats.avgSleepHours / sleepCount * 10) / 10;
  if (stepsCount > 0) stats.avgSteps = Math.round(stats.avgSteps / stepsCount);
  if (oxygenCount > 0) stats.avgOxygen = Math.round(stats.avgOxygen / oxygenCount * 10) / 10;

  return stats;
}

// Acknowledge a health alert
export async function acknowledgeAlert(alertId: string) {
  return prisma.healthAlert.update({
    where: { id: alertId },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
  });
}
