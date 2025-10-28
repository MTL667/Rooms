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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Rooms Availability</h1>
          <div className="flex gap-2">
            {session?.user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={() => router.push('/my-bookings')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              My Bookings
            </button>
            <button
              onClick={() => router.push('/auth/signout')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading rooms...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 sticky left-0 bg-white z-10 min-w-[200px]">
                      Room
                    </th>
                    {timeSlots.map((hour) => (
                      <th key={hour} className="border border-gray-300 p-2 text-sm text-center">
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
                      <tr key={room.id}>
                        <td className="border border-gray-300 p-3 sticky left-0 bg-white z-10">
                          <div className="font-semibold">{room.name}</div>
                          <div className="text-sm text-gray-600">{room.location}</div>
                          <div className="text-sm text-gray-500">Capacity: {room.capacity}</div>
                        </td>
                        {timeSlots.map((hour) => {
                          const booking = getBookingForHour(hour);
                          return (
                            <td
                              key={hour}
                              className={`border border-gray-200 p-2 text-center text-xs ${
                                booking
                                  ? 'bg-red-100 text-red-800 font-semibold'
                                  : 'bg-green-50 text-green-800'
                              }`}
                            >
                              {booking ? '🔴 Busy' : '🟢 Free'}
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
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 mb-4">No rooms available yet.</p>
            {session?.user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Rooms
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
