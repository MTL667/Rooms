'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  start: string;
  end: string;
  title: string;
}

interface Room {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  positionX: number | null;
  positionY: number | null;
  bookings: Booking[];
}

interface FloorPlan {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  imageUrl: string;
  rooms: Room[];
}

export default function FloorPlanView() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
  });
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      loadFloorPlans();
    }
  }, [session]);

  const loadFloorPlans = async () => {
    try {
      const res = await fetch('/api/floor-plans');
      const data = await res.json();
      const plans = data.floorPlans || [];
      setFloorPlans(plans);
      if (plans.length > 0 && !selectedFloorPlan) {
        setSelectedFloorPlan(plans[0].id);
      }
    } catch (error) {
      console.error('Error loading floor plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRoomAvailable = (room: Room): boolean => {
    const now = new Date();
    return !room.bookings.some((booking) => {
      const start = new Date(booking.start);
      const end = new Date(booking.end);
      return start <= now && end > now;
    });
  };

  const handleBookRoom = () => {
    setShowBookingForm(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    setBookingError(null);
    
    try {
      const start = new Date(`${bookingForm.date}T${bookingForm.startTime}`);
      const end = new Date(`${bookingForm.date}T${bookingForm.endTime}`);

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          title: bookingForm.title,
          description: bookingForm.description,
          start: start.toISOString(),
          end: end.toISOString(),
          userEmail: session?.user?.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingForm(false);
        setSelectedRoom(null);
        setBookingSuccess(false);
        setBookingForm({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: '',
        });
        loadFloorPlans(); // Refresh to show new booking
      }, 2000);
    } catch (error: any) {
      setBookingError(error.message);
    }
  };

  const currentFloorPlan = floorPlans.find((fp) => fp.id === selectedFloorPlan);

  if (status === 'loading' || loading) {
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

  if (floorPlans.length === 0) {
    return (
      <main className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-xl p-12 text-center border-2 border-teal-200">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-gray-900 font-bold text-xl mb-2">Geen plattegronden beschikbaar</p>
            <p className="text-gray-600 mb-6">Neem contact op met de beheerder om plattegronden toe te voegen.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500/90 hover:to-cyan-500/90 backdrop-blur-md border border-white/30 text-white font-bold px-8 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              ⬅️ Terug naar Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 text-white py-3 px-4 rounded-lg mb-6 shadow-lg border border-teal-400/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg border border-teal-400/30">
              <span className="text-2xl">🗺️</span>
            </div>
            <h1 className="text-2xl font-bold">Plattegrond Overzicht</h1>
          </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                📊 Tabel View
              </button>
              {session?.user?.role === 'ADMIN' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  👨‍💼 Admin
                </button>
              )}
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Floor Plan Selector */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {floorPlans.map((fp) => (
            <button
              key={fp.id}
              onClick={() => setSelectedFloorPlan(fp.id)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 border ${
                selectedFloorPlan === fp.id
                  ? 'bg-gradient-to-r from-teal-400/80 to-cyan-400/80 backdrop-blur-md text-white border-white/40'
                  : 'bg-white/60 backdrop-blur-md text-gray-700 hover:bg-white/80 border-gray-200/40'
              }`}
            >
              🏢 {fp.name}
              {fp.building && <span className="ml-2 text-sm">({fp.building})</span>}
            </button>
          ))}
        </div>

        {/* Floor Plan View */}
        {currentFloorPlan && (
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-xl border-2 border-teal-200 p-6">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentFloorPlan.name}</h2>
                {currentFloorPlan.building && (
                  <p className="text-gray-600">
                    Gebouw: {currentFloorPlan.building} {currentFloorPlan.floor && `- Verdieping ${currentFloorPlan.floor}`}
                  </p>
                )}
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 font-semibold">Beschikbaar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700 font-semibold">Bezet</span>
                </div>
              </div>
            </div>

            <div className="relative bg-white rounded-lg overflow-hidden">
              <img
                src={currentFloorPlan.imageUrl}
                alt={currentFloorPlan.name}
                className="w-full"
              />
              
              {/* Room Markers */}
              {currentFloorPlan.rooms
                .filter((room) => room.positionX !== null && room.positionY !== null)
                .map((room) => {
                  const available = isRoomAvailable(room);
                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`absolute w-10 h-10 rounded-full border-4 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white font-bold transition-all hover:scale-125 cursor-pointer ${
                        available
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                      style={{
                        left: `${room.positionX}%`,
                        top: `${room.positionY}%`,
                      }}
                      title={room.name}
                    >
                      {available ? '✓' : '✕'}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Room Details Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-6">
          <div className="bg-gradient-to-br from-teal-900 to-cyan-900 rounded-xl shadow-2xl max-w-md w-full border-2 border-teal-400">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedRoom.name}</h2>
                  <div className="space-y-1 text-teal-200">
                    {selectedRoom.location && (
                      <p className="text-sm">📍 {selectedRoom.location}</p>
                    )}
                    <p className="text-sm">👥 Capaciteit: {selectedRoom.capacity} personen</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="text-white hover:text-teal-300 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className={`p-4 rounded-lg mb-4 ${
                isRoomAvailable(selectedRoom)
                  ? 'bg-green-500/20 border border-green-500'
                  : 'bg-red-500/20 border border-red-500'
              }`}>
                <p className="text-white font-bold text-center">
                  {isRoomAvailable(selectedRoom) ? '✅ Beschikbaar' : '🔴 Bezet'}
                </p>
              </div>

              {selectedRoom.bookings.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-white font-semibold mb-2">📅 Vandaag geboekt:</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedRoom.bookings.map((booking) => (
                      <div key={booking.id} className="bg-black/30 rounded p-2 text-sm">
                        <p className="text-white font-semibold">{booking.title}</p>
                        <p className="text-teal-300">
                          {new Date(booking.start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(booking.end).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleBookRoom}
                disabled={!isRoomAvailable(selectedRoom)}
                className="w-full bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500/90 hover:to-cyan-500/90 disabled:from-gray-500/60 disabled:to-gray-600/60 disabled:cursor-not-allowed backdrop-blur-md border border-white/30 text-white font-bold py-3 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                {isRoomAvailable(selectedRoom) ? '📅 Boek Deze Kamer' : '🔒 Niet Beschikbaar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-6">
          <div className="bg-gradient-to-br from-teal-900 to-cyan-900 rounded-xl shadow-2xl max-w-lg w-full border-2 border-teal-400">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">📅 Boek {selectedRoom.name}</h2>
                  <p className="text-teal-200 text-sm">Vul de details in voor je boeking</p>
                </div>
                <button
                  onClick={() => {
                    setShowBookingForm(false);
                    setBookingError(null);
                  }}
                  className="text-white hover:text-teal-300 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              {bookingSuccess ? (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-6 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-white font-bold text-xl">Boeking Succesvol!</p>
                  <p className="text-teal-200 mt-2">Je boeking is bevestigd</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  {bookingError && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                      ⚠️ {bookingError}
                    </div>
                  )}

                  <div>
                    <label className="block text-white font-semibold mb-2">Titel *</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.title}
                      onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border-2 border-teal-400 bg-white/10 text-white placeholder-teal-300 focus:outline-none focus:border-cyan-400"
                      placeholder="Bijvoorbeeld: Team Meeting"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">Beschrijving</label>
                    <textarea
                      value={bookingForm.description}
                      onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border-2 border-teal-400 bg-white/10 text-white placeholder-teal-300 focus:outline-none focus:border-cyan-400 resize-none"
                      rows={3}
                      placeholder="Optionele beschrijving..."
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">Datum *</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 rounded-lg border-2 border-teal-400 bg-white/10 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Start Tijd *</label>
                      <input
                        type="time"
                        required
                        value={bookingForm.startTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-teal-400 bg-white/10 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2">Eind Tijd *</label>
                      <input
                        type="time"
                        required
                        value={bookingForm.endTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-teal-400 bg-white/10 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500/90 hover:to-cyan-500/90 backdrop-blur-md border border-white/30 text-white font-bold py-3 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                    >
                      ✅ Bevestigen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingForm(false);
                        setBookingError(null);
                      }}
                      className="flex-1 bg-gray-600/60 hover:bg-gray-700/70 backdrop-blur-md border border-gray-400/30 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      Annuleren
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

