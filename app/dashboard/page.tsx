'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
  bookings: Array<{
    start: string;
    end: string;
    title: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/rooms')
        .then(res => res.json())
        .then(data => {
          setRooms(data.rooms || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching rooms:', err);
          setLoading(false);
        });
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Vibrant Header Bar */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg mb-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <span className="text-2xl">🏢</span>
            </div>
            <h1 className="text-2xl font-bold">Rooms Availability</h1>
          </div>
          <div className="flex gap-2">
            {session?.user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur text-white font-semibold px-4 py-2 rounded-lg transition-all"
              >
                👨‍💼 Admin
              </button>
            )}
            <button
              onClick={() => router.push('/my-bookings')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur text-white font-semibold px-4 py-2 rounded-lg transition-all"
            >
              📅 My Bookings
            </button>
            <button
              onClick={() => router.push('/auth/signout')}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold text-lg">Loading rooms...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-indigo-100">
            <div className="min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <th className="border-r border-white/20 p-4 sticky left-0 bg-gradient-to-r from-indigo-600 to-purple-600 z-10 min-w-[200px] font-bold text-left">
                      🏢 Room
                    </th>
                    {timeSlots.map((hour) => (
                      <th key={hour} className="border border-white/20 p-2 text-sm text-center font-semibold">
                        {hour}:00
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    const getBookingForHour = (hour: number) => {
                      return room.bookings?.find((booking) => {
                        const start = new Date(booking.start);
                        const end = new Date(booking.end);
                        return start.getHours() <= hour && end.getHours() > hour;
                      });
                    };

                    return (
                      <tr key={room.id} className="hover:bg-indigo-50 transition-colors">
                        <td className="border border-gray-200 p-4 sticky left-0 bg-white z-10 border-r-2 border-indigo-300">
                          <div className="font-bold text-indigo-900 text-lg">{room.name}</div>
                          <div className="text-sm text-gray-600 font-medium">{room.location}</div>
                          <div className="text-sm text-purple-600 font-semibold">👥 {room.capacity} people</div>
                        </td>
                        {timeSlots.map((hour) => {
                          const booking = getBookingForHour(hour);
                          return (
                            <td
                              key={hour}
                              className={`border border-gray-200 p-2 text-center text-xs font-semibold transition-all ${
                                booking
                                  ? 'bg-gradient-to-br from-red-100 to-pink-100 text-red-700'
                                  : 'bg-gradient-to-br from-green-100 to-emerald-50 text-green-700'
                              }`}
                            >
                              {booking ? '🔴' : '🟢'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rooms.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-xl p-12 text-center border-2 border-indigo-200">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-gray-700 font-bold text-xl mb-2">No rooms available yet.</p>
            <p className="text-gray-500 mb-6">Get started by adding your first room.</p>
            {session?.user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105"
              >
                ➕ Add Rooms
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
