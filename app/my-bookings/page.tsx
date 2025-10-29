'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  title: string;
  room: { name: string; location: string | null };
  start: string;
  end: string;
  status: string;
}

export default function MyBookings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/me/bookings')
        .then(res => res.json())
        .then(data => {
          setBookings(data.bookings || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching bookings:', err);
          setLoading(false);
        });
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const now = new Date();
  const upcoming = bookings.filter(b => new Date(b.end) > now);
  const past = bookings.filter(b => new Date(b.end) <= now);

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 text-white py-4 px-6 rounded-xl shadow-lg mb-6 border border-teal-400/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg border border-teal-400/30">
                <span className="text-2xl">📅</span>
              </div>
              <h1 className="text-3xl font-bold">My Bookings</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                🏠 Dashboard
              </button>
              <button
                onClick={() => router.push('/auth/signout')}
                className="bg-red-500/60 hover:bg-red-500/80 backdrop-blur-md border border-red-400/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-lg p-12 text-center border border-teal-200">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-400 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold text-lg">Loading bookings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white px-3 py-1 rounded-lg text-lg">
                  ✅
                </span>
                Upcoming ({upcoming.length})
              </h2>
              {upcoming.length === 0 ? (
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-lg p-12 text-center border-2 border-teal-200">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-gray-600 font-semibold">No upcoming bookings</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {upcoming.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-lg p-6 border-2 border-teal-200 hover:shadow-xl transition-all"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{booking.title}</h3>
                      <p className="text-gray-700 mb-3">🏢 {booking.room.name}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-lg font-semibold">
                          📅 {new Date(booking.start).toLocaleDateString()}
                        </span>
                        <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-lg font-semibold">
                          🕐 {new Date(booking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Bookings */}
            {past.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1 rounded-lg text-lg">
                    📜
                  </span>
                  Past ({past.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {past.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl shadow-lg p-6 border-2 border-gray-200"
                    >
                      <h3 className="text-xl font-bold text-gray-700 mb-2">{booking.title}</h3>
                      <p className="text-gray-600 mb-3">🏢 {booking.room.name}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-semibold">
                          {new Date(booking.start).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
