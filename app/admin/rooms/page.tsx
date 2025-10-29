'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string;
}

interface Room {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  msResourceEmail: string | null;
  hourlyRateCents: number;
  active: boolean;
  createdAt: string;
  floorPlanId: string | null;
  positionX: number | null;
  positionY: number | null;
  _count: { bookings: number };
}

export default function RoomsManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 10,
    msResourceEmail: '',
    active: true,
    floorPlanId: '',
    positionX: null as number | null,
    positionY: null as number | null,
  });
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadRooms();
    loadFloorPlans();
  }, [session, router]);

  const loadRooms = async () => {
    try {
      const res = await fetch('/api/admin/rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFloorPlans = async () => {
    try {
      const res = await fetch('/api/admin/floor-plans');
      const data = await res.json();
      setFloorPlans(data.floorPlans || []);
    } catch (error) {
      console.error('Error loading floor plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          msResourceEmail: formData.msResourceEmail || null,
          floorPlanId: formData.floorPlanId || null,
          positionX: formData.positionX,
          positionY: formData.positionY,
        }),
      });
      loadRooms();
      setShowForm(false);
      setShowPositionPicker(false);
      setFormData({ name: '', location: '', capacity: 10, msResourceEmail: '', active: true, floorPlanId: '', positionX: null, positionY: null });
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const deleteRoom = async (id: string) => {
    if (!confirm('Delete this room?')) return;
    try {
      await fetch(`/api/admin/rooms/${id}`, { method: 'DELETE' });
      loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  if (loading) return <div className="p-6 bg-white">Loading...</div>;

  return (
    <main className="p-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {showForm ? 'Cancel' : 'Add Room'}
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  placeholder="Conference Room A"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                    placeholder="Floor 2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">MS Resource Email</label>
                <input
                  type="email"
                  value={formData.msResourceEmail}
                  onChange={(e) => setFormData({ ...formData, msResourceEmail: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  placeholder="room-a@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">🗺️ Floor Plan (optioneel)</label>
                <select
                  value={formData.floorPlanId}
                  onChange={(e) => setFormData({ ...formData, floorPlanId: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                >
                  <option value="">Geen plattegrond</option>
                  {floorPlans.map((fp) => (
                    <option key={fp.id} value={fp.id}>{fp.name}</option>
                  ))}
                </select>
              </div>

              {formData.floorPlanId && (
                <div className="border-2 border-teal-300 rounded-lg p-4 bg-teal-50">
                  <label className="block text-sm font-semibold mb-2 text-gray-900">
                    📍 Positie op Plattegrond
                  </label>
                  {formData.positionX !== null && formData.positionY !== null ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        X: {formData.positionX.toFixed(1)}%, Y: {formData.positionY.toFixed(1)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPositionPicker(true)}
                        className="bg-teal-400/80 hover:bg-teal-500/90 backdrop-blur-md border border-teal-300/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        🎯 Wijzig Positie
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPositionPicker(true)}
                      className="w-full bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500/90 hover:to-cyan-500/90 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                    >
                      🎯 Klik om Positie te Selecteren
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label className="text-sm font-semibold text-gray-900">Active</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700">
                  Create Room
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3 text-left text-white font-semibold">Name</th>
                <th className="p-3 text-left text-white font-semibold">Location</th>
                <th className="p-3 text-left text-white font-semibold">Capacity</th>
                <th className="p-3 text-left text-white font-semibold">MS Email</th>
                <th className="p-3 text-left text-white font-semibold">Bookings</th>
                <th className="p-3 text-left text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-t hover:bg-white">
                  <td className="p-3 font-semibold text-gray-900">{room.name}</td>
                  <td className="p-3 text-gray-700">{room.location || '-'}</td>
                  <td className="p-3 text-gray-900">{room.capacity}</td>
                  <td className="p-3 text-sm text-gray-600 font-mono">{room.msResourceEmail || '-'}</td>
                  <td className="p-3 text-gray-900">{room._count.bookings}</td>
                  <td className="p-3">
                    <button
                      onClick={() => deleteRoom(room.id)}
                      className="text-red-600 hover:underline text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rooms.length === 0 && (
            <div className="p-6 text-center text-gray-700 font-medium">No rooms yet</div>
          )}
        </div>
      </div>

      {/* Position Picker Modal */}
      {showPositionPicker && formData.floorPlanId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">🎯 Selecteer Kamer Positie</h2>
                <button
                  onClick={() => setShowPositionPicker(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Klik op de plattegrond waar de kamer zich bevindt
              </p>
              <div className="border-4 border-teal-500 rounded-lg overflow-hidden relative">
                <img
                  src={floorPlans.find(fp => fp.id === formData.floorPlanId)?.imageUrl}
                  alt="Floor plan"
                  className="w-full cursor-crosshair"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setFormData({ ...formData, positionX: x, positionY: y });
                  }}
                />
                {formData.positionX !== null && formData.positionY !== null && (
                  <div
                    className="absolute w-8 h-8 bg-red-500 border-4 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white font-bold"
                    style={{
                      left: `${formData.positionX}%`,
                      top: `${formData.positionY}%`,
                    }}
                  >
                    📍
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {formData.positionX !== null && formData.positionY !== null ? (
                    <span className="font-semibold">
                      Positie: X: {formData.positionX.toFixed(1)}%, Y: {formData.positionY.toFixed(1)}%
                    </span>
                  ) : (
                    <span>Klik op de plattegrond om een positie te selecteren</span>
                  )}
                </div>
                <button
                  onClick={() => setShowPositionPicker(false)}
                  disabled={formData.positionX === null || formData.positionY === null}
                  className="bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500/90 hover:to-cyan-500/90 disabled:from-gray-400/60 disabled:to-gray-500/60 disabled:cursor-not-allowed backdrop-blur-md border border-white/30 text-white px-6 py-2 rounded-xl font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  ✅ Bevestigen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
