import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { createBooking, getUserBookings, TREATMENTS } from '@/lib/medbed';

const bookingSchema = z.object({
  deviceId: z.string(),
  scheduledStart: z.string().datetime(),
  durationMinutes: z.number().min(15).max(120),
  treatmentType: z.enum([
    'GENERAL_WELLNESS',
    'CELLULAR_REGENERATION',
    'PAIN_MANAGEMENT',
    'SLEEP_OPTIMIZATION',
    'MENTAL_CLARITY',
    'DETOXIFICATION',
    'IMMUNE_BOOST',
    'ANTI_AGING',
    'INJURY_RECOVERY',
    'CHRONIC_CONDITION',
    'DIAGNOSTIC_SCAN',
    'CUSTOM',
  ]),
  treatmentNotes: z.string().optional(),
  useTokens: z.boolean().optional(),
});

// GET /api/medbed/bookings - Get user's bookings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const bookings = await getUserBookings(session.user.id, status);

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        ...b,
        priceTotal: Number(b.priceTotal),
        tokensCost: b.tokensCost ? Number(b.tokensCost) : null,
        refundAmount: b.refundAmount ? Number(b.refundAmount) : null,
      })),
      treatments: TREATMENTS,
    });
  } catch (error) {
    console.error('Bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST /api/medbed/bookings - Create a new booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = bookingSchema.parse(body);

    const booking = await createBooking({
      userId: session.user.id,
      deviceId: data.deviceId,
      scheduledStart: new Date(data.scheduledStart),
      durationMinutes: data.durationMinutes,
      treatmentType: data.treatmentType,
      treatmentNotes: data.treatmentNotes,
      useTokens: data.useTokens,
    });

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        priceTotal: Number(booking.priceTotal),
        tokensCost: booking.tokensCost ? Number(booking.tokensCost) : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create booking' },
      { status: 500 }
    );
  }
}
