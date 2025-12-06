import { NextRequest, NextResponse } from 'next/server';

import { getFacilities } from '@/lib/medbed';

// GET /api/medbed/facilities - Get all MedBed facilities
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || undefined;
    const country = searchParams.get('country') || undefined;

    const facilities = await getFacilities({ city, country });

    return NextResponse.json({
      facilities: facilities.map((f) => ({
        ...f,
        latitude: f.latitude ? Number(f.latitude) : null,
        longitude: f.longitude ? Number(f.longitude) : null,
        deviceCount: f._count.devices,
        availableDevices: f.devices.filter((d) => d.status === 'ONLINE').length,
      })),
    });
  } catch (error) {
    console.error('Facilities error:', error);
    return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 });
  }
}
