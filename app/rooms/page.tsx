'use client';

import { useState, useEffect } from 'react';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Available Rooms</h1>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Available Rooms</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Create Booking
          </button>
        </div>
        
        {rooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">No rooms available yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Run the seed script to add sample rooms.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room: any) => (
              <div key={room.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold">{room.name}</h2>
                      {room.active && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-1">{room.location}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mt-2">
                      <span>📦 Capacity: {room.capacity} people</span>
                      {room.msResourceEmail && (
                        <span>🔗 Synced with Outlook</span>
                      )}
                    </div>
                    {room.bookings && room.bookings.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          📅 {room.bookings.length} upcoming booking(s)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
