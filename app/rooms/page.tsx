'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Available Rooms</h1>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">🏢 Available Rooms</h1>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur text-white font-semibold px-6 py-2 rounded-lg transition-all"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
        
        {rooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-indigo-200">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-gray-700 font-bold text-xl mb-2">No rooms available yet.</p>
            <p className="text-gray-500">Run the seed script to add sample rooms.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room: any) => (
              <div 
                key={room.id} 
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-indigo-100 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-indigo-900">{room.name}</h2>
                  {room.active && (
                    <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      ✓ Active
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-3 font-medium">📍 {room.location}</p>
                <div className="flex gap-4 text-sm mb-4">
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-semibold">
                    👥 {room.capacity} people
                  </span>
                  {room.msResourceEmail && (
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg font-semibold">
                      🔗 Synced
                    </span>
                  )}
                </div>
                {room.bookings && room.bookings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-semibold">
                      📅 {room.bookings.length} upcoming booking(s)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
