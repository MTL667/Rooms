'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Room {
  id: string;
  name: string;
  location: string | null;
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

  const loadRooms = () => {
    if (!session) return;
    fetch('/api/rooms', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setRooms(data.rooms || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching rooms:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (session) {
      loadRooms();
      // Refresh every 30 seconds
      const interval = setInterval(loadRooms, 30000);
      // Refresh when window regains focus
      window.addEventListener('focus', loadRooms);
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', loadRooms);
      };
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-gray-900 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Show only hours from 6:00 to 22:00
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6);

  return (
    <main className="min-h-screen bg-white p-6">
      {/* SPOQ-inspired Header Bar */}
      <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 text-white py-3 px-4 rounded-lg mb-6 shadow-lg border border-teal-400/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg border border-teal-400/30">
              <span className="text-2xl">🏢</span>
            </div>
            <h1 className="text-2xl font-bold">Rooms Availability</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/floor-plan')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              🗺️ Plattegrond
            </button>
            {session?.user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                👨‍💼 Admin
              </button>
            )}
            <button
              onClick={() => router.push('/my-bookings')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              📅 My Bookings
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

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="bg-gradient-to-br from-teal-900/50 to-cyan-900/50 rounded-xl shadow-lg p-12 text-center border border-teal-400/20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-400 mx-auto mb-4"></div>
            <p className="text-white font-semibold text-lg">Loading rooms...</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-teal-900/30 to-cyan-900/30 rounded-xl shadow-xl overflow-hidden border border-teal-400/20">
            <div className="min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-400 text-white">
                    <th className="border-r border-white/20 p-4 sticky left-0 bg-gradient-to-r from-teal-500 to-cyan-400 z-10 min-w-[200px] font-bold text-left">
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
                    // Calculate position and width for each booking as a percentage
                    const bookingsWithPositions = room.bookings?.map((booking) => {
                      const start = new Date(booking.start);
                      const end = new Date(booking.end);
                      const startHour = start.getHours() + start.getMinutes() / 60;
                      const endHour = end.getHours() + end.getMinutes() / 60;
                      
                      // Calculate position from 6:00
                      const startPos = ((startHour - 6) / 17) * 100;
                      const width = ((endHour - startHour) / 17) * 100;
                      
                      return {
                        ...booking,
                        startPos: Math.max(0, Math.min(100, startPos)),
                        width: Math.max(0, Math.min(100 - startPos, width)),
                        startTime: start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
                        endTime: end.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
                      };
                    }) || [];

                    return (
                      <tr key={room.id} className="hover:bg-teal-900/20 transition-colors border-b border-teal-400/10">
                        <td className="border border-teal-400/20 p-4 sticky left-0 bg-gradient-to-br from-teal-900/40 to-cyan-900/40 z-10 border-r-2 border-teal-400/30">
                          <div className="font-bold text-white text-lg">{room.name}</div>
                          <div className="text-sm text-teal-300 font-medium">{room.location}</div>
                          <div className="text-sm text-cyan-300 font-semibold">👥 {room.capacity} people</div>
                        </td>
                        <td colSpan={timeSlots.length} className="border border-teal-400/20 p-0 relative h-16 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                          {/* Time grid lines */}
                          <div className="absolute inset-0 flex">
                            {timeSlots.map((hour, idx) => (
                              <div
                                key={hour}
                                className="flex-1 border-r border-teal-400/10"
                                style={{ borderRight: idx === timeSlots.length - 1 ? 'none' : undefined }}
                              />
                            ))}
                          </div>
                          
                          {/* Booking bars */}
                          {bookingsWithPositions.map((booking, idx) => (
                            <div
                              key={booking.id}
                              className="absolute top-1 bottom-1 bg-gradient-to-r from-red-500/80 to-pink-500/80 backdrop-blur-sm border-2 border-red-400/40 rounded-lg shadow-lg flex items-center justify-center overflow-hidden group hover:shadow-xl transition-all cursor-pointer"
                              style={{
                                left: `${booking.startPos}%`,
                                width: `${booking.width}%`,
                                zIndex: 10 + idx,
                              }}
                              title={`${booking.title}\n${booking.startTime} - ${booking.endTime}`}
                            >
                              <div className="text-white text-xs font-bold px-2 truncate">
                                {booking.width > 8 && (
                                  <span>{booking.startTime} - {booking.endTime}</span>
                                )}
                                {booking.width > 15 && (
                                  <span className="ml-2">• {booking.title}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* Show "Free" if no bookings */}
                          {bookingsWithPositions.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                              ✓ Beschikbaar
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rooms.length === 0 && !loading && (
          <div className="bg-gradient-to-br from-teal-900/40 to-cyan-900/40 rounded-xl shadow-xl p-12 text-center border border-teal-400/20">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-white font-bold text-xl mb-2">No rooms available yet.</p>
            <p className="text-teal-300 mb-6">Get started by adding your first room.</p>
            {session?.user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-400 hover:from-teal-600 hover:via-cyan-500 hover:to-teal-500 text-white font-bold px-8 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 border border-teal-300/50"
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
