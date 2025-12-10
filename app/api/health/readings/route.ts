import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { recordHealthReading } from '@/lib/health';

const readingSchema = z.object({
  heartRate: z.number().min(30).max(220).optional(),
  bloodPressureSystolic: z.number().min(70).max(250).optional(),
  bloodPressureDiastolic: z.number().min(40).max(150).optional(),
  oxygenSaturation: z.number().min(70).max(100).optional(),
  temperature: z.number().min(35).max(42).optional(),
  steps: z.number().min(0).optional(),
  caloriesBurned: z.number().min(0).optional(),
  activeMinutes: z.number().min(0).optional(),
  distance: z.number().min(0).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.enum(['POOR', 'FAIR', 'GOOD', 'EXCELLENT']).optional(),
  weight: z.number().min(20).max(500).optional(),
  bodyFat: z.number().min(1).max(70).optional(),
  mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'BAD', 'TERRIBLE']).optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  source: z.string().optional(),
  deviceId: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/health/readings - Record a new health reading
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = readingSchema.parse(body);

    const reading = await recordHealthReading(session.user.id, data);

    return NextResponse.json({
      success: true,
      reading,
      message: 'Health reading recorded successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Health reading error:', error);
    return NextResponse.json({ error: 'Failed to record reading' }, { status: 500 });
  }
}
