/**
 * MedBed System Integration
 * Manages MedBed device bookings, sessions, and health monitoring
 */

import { prisma } from './prismaClient';

// Treatment descriptions and durations
export const TREATMENTS = {
  GENERAL_WELLNESS: {
    name: 'General Wellness',
    description: 'Full-body scan and optimization for overall health improvement',
    defaultDuration: 30,
    minDuration: 15,
    maxDuration: 60,
  },
  CELLULAR_REGENERATION: {
    name: 'Cellular Regeneration',
    description: 'Advanced cellular repair and regeneration therapy',
    defaultDuration: 45,
    minDuration: 30,
    maxDuration: 90,
  },
  PAIN_MANAGEMENT: {
    name: 'Pain Management',
    description: 'Targeted pain relief and inflammation reduction',
    defaultDuration: 30,
    minDuration: 20,
    maxDuration: 60,
  },
  SLEEP_OPTIMIZATION: {
    name: 'Sleep Optimization',
    description: 'Brainwave entrainment for improved sleep quality',
    defaultDuration: 45,
    minDuration: 30,
    maxDuration: 60,
  },
  MENTAL_CLARITY: {
    name: 'Mental Clarity',
    description: 'Cognitive enhancement and mental focus improvement',
    defaultDuration: 30,
    minDuration: 20,
    maxDuration: 45,
  },
  DETOXIFICATION: {
    name: 'Detoxification',
    description: 'Full-body detox and toxin elimination',
    defaultDuration: 45,
    minDuration: 30,
    maxDuration: 90,
  },
  IMMUNE_BOOST: {
    name: 'Immune System Boost',
    description: 'Strengthen and optimize immune system function',
    defaultDuration: 30,
    minDuration: 20,
    maxDuration: 60,
  },
  ANTI_AGING: {
    name: 'Anti-Aging',
    description: 'Cellular rejuvenation and age reversal therapy',
    defaultDuration: 60,
    minDuration: 45,
    maxDuration: 120,
  },
  INJURY_RECOVERY: {
    name: 'Injury Recovery',
    description: 'Accelerated healing for injuries and wounds',
    defaultDuration: 45,
    minDuration: 30,
    maxDuration: 90,
  },
  CHRONIC_CONDITION: {
    name: 'Chronic Condition Management',
    description: 'Long-term treatment for chronic health conditions',
    defaultDuration: 60,
    minDuration: 45,
    maxDuration: 120,
  },
  DIAGNOSTIC_SCAN: {
    name: 'Diagnostic Scan',
    description: 'Comprehensive health scan and analysis',
    defaultDuration: 20,
    minDuration: 15,
    maxDuration: 30,
  },
  CUSTOM: {
    name: 'Custom Treatment',
    description: 'Personalized treatment based on individual needs',
    defaultDuration: 45,
    minDuration: 15,
    maxDuration: 120,
  },
};

// Generate unique booking number
function generateBookingNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MB-${timestamp}-${random}`;
}

// Get available facilities
export async function getFacilities(filters?: {
  city?: string;
  country?: string;
  isActive?: boolean;
}) {
  return prisma.medBedFacility.findMany({
    where: {
      isActive: filters?.isActive ?? true,
      ...(filters?.city && { city: filters.city }),
      ...(filters?.country && { country: filters.country }),
    },
    include: {
      devices: {
        where: { status: { in: ['ONLINE', 'IN_USE'] } },
        select: { id: true, name: true, model: true, status: true },
      },
      _count: { select: { devices: true } },
    },
    orderBy: { name: 'asc' },
  });
}

// Get facility by slug
export async function getFacilityBySlug(slug: string) {
  return prisma.medBedFacility.findUnique({
    where: { slug },
    include: {
      devices: true,
      staff: { where: { isActive: true } },
    },
  });
}

// Get available time slots for a device
export async function getAvailableSlots(params: {
  deviceId: string;
  date: Date;
  durationMinutes: number;
}) {
  const { deviceId, date, durationMinutes } = params;

  const device = await prisma.medBedDevice.findUnique({
    where: { id: deviceId },
    include: { facility: true },
  });

  if (!device) {
    throw new Error('Device not found');
  }

  // Get facility operating hours for the day
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const operatingHours = device.facility.operatingHours as Record<
    string,
    { open: string; close: string }
  > | null;

  const dayHours = operatingHours?.[dayOfWeek];
  if (!dayHours) {
    return []; // Facility closed on this day
  }

  // Get existing bookings for the day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.medBedBooking.findMany({
    where: {
      deviceId,
      scheduledStart: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELED', 'NO_SHOW'] },
    },
    orderBy: { scheduledStart: 'asc' },
  });

  // Generate available slots
  const slots: Array<{ start: Date; end: Date }> = [];
  const [openHour, openMinute] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);

  let currentSlot = new Date(date);
  currentSlot.setHours(openHour, openMinute, 0, 0);

  const closingTime = new Date(date);
  closingTime.setHours(closeHour, closeMinute, 0, 0);

  while (currentSlot.getTime() + durationMinutes * 60000 <= closingTime.getTime()) {
    const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000);

    // Check if slot conflicts with existing bookings
    const hasConflict = existingBookings.some((booking) => {
      const bookingStart = new Date(booking.scheduledStart);
      const bookingEnd = new Date(booking.scheduledEnd);
      return currentSlot < bookingEnd && slotEnd > bookingStart;
    });

    if (!hasConflict && currentSlot > new Date()) {
      slots.push({ start: new Date(currentSlot), end: slotEnd });
    }

    // Move to next slot (30-minute intervals)
    currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
  }

  return slots;
}

// Create a booking
export async function createBooking(params: {
  userId: string;
  deviceId: string;
  scheduledStart: Date;
  durationMinutes: number;
  treatmentType: keyof typeof TREATMENTS;
  treatmentNotes?: string;
  paymentMethod?: string;
  useTokens?: boolean;
}) {
  const {
    userId,
    deviceId,
    scheduledStart,
    durationMinutes,
    treatmentType,
    treatmentNotes,
    paymentMethod,
    useTokens,
  } = params;

  const device = await prisma.medBedDevice.findUnique({
    where: { id: deviceId },
    include: { facility: true },
  });

  if (!device) {
    throw new Error('Device not found');
  }

  if (device.status === 'MAINTENANCE' || device.status === 'ERROR') {
    throw new Error('Device is not available');
  }

  // Calculate price
  const pricePerMinute = Number(device.pricePerMinute);
  const priceTotal = pricePerMinute * durationMinutes;
  const tokensCost = useTokens ? priceTotal * 10 : null; // $1 = 10 ADV tokens

  // If using tokens, check balance
  if (useTokens) {
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId },
    });

    if (!wallet || Number(wallet.balance) - Number(wallet.lockedBalance) < tokensCost!) {
      throw new Error('Insufficient token balance');
    }
  }

  const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60000);

  // Check for conflicts
  const conflictingBooking = await prisma.medBedBooking.findFirst({
    where: {
      deviceId,
      status: { notIn: ['CANCELED', 'NO_SHOW'] },
      OR: [
        {
          scheduledStart: { lt: scheduledEnd },
          scheduledEnd: { gt: scheduledStart },
        },
      ],
    },
  });

  if (conflictingBooking) {
    throw new Error('Time slot is no longer available');
  }

  // Create booking
  const booking = await prisma.medBedBooking.create({
    data: {
      bookingNumber: generateBookingNumber(),
      userId,
      deviceId,
      facilityId: device.facilityId,
      scheduledStart,
      scheduledEnd,
      durationMinutes,
      treatmentType: treatmentType as never,
      treatmentNotes,
      priceTotal,
      tokensCost,
      paymentMethod,
      paymentStatus: useTokens ? 'PROCESSING' : 'PENDING',
      status: 'PENDING',
    },
    include: {
      device: true,
      facility: true,
    },
  });

  // If using tokens, lock them
  if (useTokens && tokensCost) {
    await prisma.tokenWallet.update({
      where: { userId },
      data: { lockedBalance: { increment: tokensCost } },
    });
  }

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title: 'Booking Created',
      message: `Your MedBed session at ${device.facility.name} has been booked for ${scheduledStart.toLocaleString()}.`,
      data: { bookingId: booking.id },
    },
  });

  return booking;
}

// Confirm booking payment
export async function confirmBookingPayment(bookingId: string, paymentId?: string) {
  const booking = await prisma.medBedBooking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // If paid with tokens, deduct from wallet
  if (booking.tokensCost) {
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId: booking.userId },
    });

    if (wallet) {
      const tokensCost = Number(booking.tokensCost);
      await prisma.tokenWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: tokensCost },
          lockedBalance: { decrement: tokensCost },
          lifetimeSpent: { increment: tokensCost },
        },
      });

      await prisma.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'PURCHASE',
          amount: -tokensCost,
          balanceAfter: Number(wallet.balance) - tokensCost,
          description: `MedBed booking: ${booking.bookingNumber}`,
          metadata: { bookingId },
        },
      });
    }
  }

  return prisma.medBedBooking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: 'PAID',
      paymentId,
      status: 'CONFIRMED',
    },
  });
}

// Start a session
export async function startSession(bookingId: string, supervisorId?: string) {
  const booking = await prisma.medBedBooking.findUnique({
    where: { id: bookingId },
    include: { device: true },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status !== 'CONFIRMED' && booking.status !== 'CHECKED_IN') {
    throw new Error('Booking is not ready to start');
  }

  // Update device status
  await prisma.medBedDevice.update({
    where: { id: booking.deviceId },
    data: { status: 'IN_USE' },
  });

  // Create session
  const session = await prisma.medBedSession.create({
    data: {
      bookingId,
      deviceId: booking.deviceId,
      userId: booking.userId,
      startedAt: new Date(),
      treatmentType: booking.treatmentType,
      supervisorId,
      status: 'IN_PROGRESS',
    },
  });

  // Update booking status
  await prisma.medBedBooking.update({
    where: { id: bookingId },
    data: { status: 'IN_PROGRESS' },
  });

  return session;
}

// Record session reading
export async function recordSessionReading(
  sessionId: string,
  data: {
    heartRate?: number;
    bloodPressureSys?: number;
    bloodPressureDia?: number;
    oxygenSaturation?: number;
    temperature?: number;
    brainwaveAlpha?: number;
    brainwaveBeta?: number;
    brainwaveTheta?: number;
    brainwaveDelta?: number;
    bioFieldStrength?: number;
    cellularResonance?: number;
    devicePowerLevel?: number;
    frequencyHz?: number;
  }
) {
  const session = await prisma.medBedSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const minutesMark = Math.floor((Date.now() - session.startedAt.getTime()) / 60000);

  return prisma.medBedReading.create({
    data: {
      sessionId,
      minutesMark,
      heartRate: data.heartRate,
      bloodPressureSys: data.bloodPressureSys,
      bloodPressureDia: data.bloodPressureDia,
      oxygenSaturation: data.oxygenSaturation,
      temperature: data.temperature,
      brainwaveAlpha: data.brainwaveAlpha,
      brainwaveBeta: data.brainwaveBeta,
      brainwaveTheta: data.brainwaveTheta,
      brainwaveDelta: data.brainwaveDelta,
      bioFieldStrength: data.bioFieldStrength,
      cellularResonance: data.cellularResonance,
      devicePowerLevel: data.devicePowerLevel,
      frequencyHz: data.frequencyHz,
    },
  });
}

// End session
export async function endSession(sessionId: string, completionNotes?: string) {
  const session = await prisma.medBedSession.findUnique({
    where: { id: sessionId },
    include: { booking: true },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const endedAt = new Date();
  const actualDuration = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 60000);

  // Update session
  const updatedSession = await prisma.medBedSession.update({
    where: { id: sessionId },
    data: {
      endedAt,
      actualDuration,
      status: 'COMPLETED',
      completionNotes,
    },
  });

  // Update booking
  await prisma.medBedBooking.update({
    where: { id: session.bookingId },
    data: { status: 'COMPLETED' },
  });

  // Update device status
  await prisma.medBedDevice.update({
    where: { id: session.deviceId },
    data: { status: 'ONLINE' },
  });

  // Award tokens for completing session
  const wallet = await prisma.tokenWallet.findUnique({
    where: { userId: session.userId },
  });

  if (wallet) {
    const bonusTokens = Math.floor(actualDuration * 0.5); // 0.5 tokens per minute
    await prisma.tokenWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: bonusTokens },
        lifetimeEarned: { increment: bonusTokens },
      },
    });

    await prisma.tokenTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'BONUS',
        amount: bonusTokens,
        balanceAfter: Number(wallet.balance) + bonusTokens,
        description: `MedBed session completion bonus`,
        metadata: { sessionId },
      },
    });
  }

  // Create notification
  await prisma.notification.create({
    data: {
      userId: session.userId,
      type: 'SYSTEM',
      title: 'Session Completed',
      message: `Your MedBed session has been completed. Duration: ${actualDuration} minutes.`,
      data: { sessionId },
    },
  });

  return updatedSession;
}

// Get user's bookings
export async function getUserBookings(userId: string, status?: string) {
  return prisma.medBedBooking.findMany({
    where: {
      userId,
      ...(status && { status: status as never }),
    },
    include: {
      device: true,
      facility: true,
      session: true,
    },
    orderBy: { scheduledStart: 'desc' },
  });
}

// Get user's session history
export async function getUserSessions(userId: string) {
  return prisma.medBedSession.findMany({
    where: { userId },
    include: {
      device: true,
      booking: { include: { facility: true } },
      readings: { orderBy: { timestamp: 'asc' } },
    },
    orderBy: { startedAt: 'desc' },
  });
}

// Cancel booking
export async function cancelBooking(bookingId: string, reason?: string) {
  const booking = await prisma.medBedBooking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (['IN_PROGRESS', 'COMPLETED', 'CANCELED'].includes(booking.status)) {
    throw new Error('Cannot cancel this booking');
  }

  // Refund tokens if paid with tokens
  if (booking.tokensCost && booking.paymentStatus === 'PAID') {
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId: booking.userId },
    });

    if (wallet) {
      const refundAmount = Number(booking.tokensCost);
      await prisma.tokenWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: refundAmount },
          lifetimeSpent: { decrement: refundAmount },
        },
      });

      await prisma.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'BONUS',
          amount: refundAmount,
          balanceAfter: Number(wallet.balance) + refundAmount,
          description: `Refund for canceled booking: ${booking.bookingNumber}`,
          metadata: { bookingId },
        },
      });
    }
  } else if (booking.tokensCost) {
    // Unlock tokens if not yet paid
    await prisma.tokenWallet.update({
      where: { userId: booking.userId },
      data: { lockedBalance: { decrement: Number(booking.tokensCost) } },
    });
  }

  return prisma.medBedBooking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelReason: reason,
      refundAmount: booking.tokensCost,
    },
  });
}
