'use client';

import { Activity, Calendar, Clock, Heart, MapPin, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Facility {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  deviceCount: number;
  availableDevices: number;
}

interface Booking {
  id: string;
  bookingNumber: string;
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  treatmentType: string;
  priceTotal: number;
  tokensCost: number | null;
  status: string;
  paymentStatus: string;
  device: { name: string; model: string };
  facility: { name: string; city: string };
}

const treatmentIcons: Record<string, typeof Heart> = {
  GENERAL_WELLNESS: Sparkles,
  CELLULAR_REGENERATION: Zap,
  PAIN_MANAGEMENT: Heart,
  SLEEP_OPTIMIZATION: Activity,
  MENTAL_CLARITY: Activity,
  DETOXIFICATION: Activity,
  IMMUNE_BOOST: Heart,
  ANTI_AGING: Sparkles,
  INJURY_RECOVERY: Heart,
  CHRONIC_CONDITION: Heart,
  DIAGNOSTIC_SCAN: Activity,
  CUSTOM: Zap,
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-slate-100 text-slate-800',
};

export default function MedBedPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [facilitiesRes, bookingsRes] = await Promise.all([
        fetch('/api/medbed/facilities'),
        fetch('/api/medbed/bookings'),
      ]);

      if (facilitiesRes.ok) {
        const data = await facilitiesRes.json();
        setFacilities(data.facilities);
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Failed to fetch MedBed data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const upcomingBookings = bookings.filter((b) =>
    ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)
  );
  const pastBookings = bookings.filter((b) =>
    ['COMPLETED', 'CANCELED', 'NO_SHOW'].includes(b.status)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">MedBed Sessions</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Book and manage your MedBed healing sessions
        </p>
      </div>

      {/* Hero Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500">
        <CardContent className="p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Advanced Healing Technology</h2>
              <p className="mt-2 max-w-md text-white/80">
                Experience cellular regeneration, pain relief, and holistic wellness with our
                state-of-the-art MedBed technology.
              </p>
              <Button className="mt-4 bg-white text-teal-600 hover:bg-white/90">
                Book a Session
              </Button>
            </div>
            <div className="hidden md:block">
              <div className="rounded-full bg-white/20 p-6">
                <Zap className="h-16 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-teal-100 p-3 dark:bg-teal-950">
              <MapPin className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{facilities.length}</p>
              <p className="text-sm text-slate-500">Facilities</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingBookings.length}</p>
              <p className="text-sm text-slate-500">Upcoming Sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950">
              <Sparkles className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {pastBookings.filter((b) => b.status === 'COMPLETED').length}
              </p>
              <p className="text-sm text-slate-500">Completed Sessions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>Your scheduled MedBed appointments</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-500">No upcoming sessions</p>
              <Button variant="outline" className="mt-4">
                Book Your First Session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => {
                const TreatmentIcon = treatmentIcons[booking.treatmentType] || Activity;
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border p-4 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-teal-100 p-3 dark:bg-teal-950">
                        <TreatmentIcon className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.treatmentType.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-slate-500">
                          {booking.facility.name} • {booking.device.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(booking.scheduledStart).toLocaleDateString()}
                          <Clock className="ml-2 h-4 w-4" />
                          {new Date(booking.scheduledStart).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          <span className="ml-2">({booking.durationMinutes} min)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[booking.status]}`}
                      >
                        {booking.status}
                      </span>
                      <p className="mt-2 font-semibold">
                        {booking.tokensCost
                          ? `${booking.tokensCost} ADV`
                          : `$${booking.priceTotal.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facilities */}
      <Card>
        <CardHeader>
          <CardTitle>Available Facilities</CardTitle>
          <CardDescription>Find a MedBed center near you</CardDescription>
        </CardHeader>
        <CardContent>
          {facilities.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No facilities available</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {facilities.map((facility) => (
                <div key={facility.id} className="rounded-lg border p-4 dark:border-slate-700">
                  <h4 className="font-semibold">{facility.name}</h4>
                  <p className="text-sm text-slate-500">
                    {facility.city}, {facility.country}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {facility.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      {facility.availableDevices} of {facility.deviceCount} devices available
                    </span>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Sessions */}
      {pastBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>Your past MedBed sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <div>
                    <p className="font-medium">{booking.treatmentType.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(booking.scheduledStart).toLocaleDateString()} •{' '}
                      {booking.durationMinutes} min
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[booking.status]}`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
