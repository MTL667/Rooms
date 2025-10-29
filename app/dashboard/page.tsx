'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

interface Booking {
  id: string;
  start: string;
  end: string;
  title: string;
  description: string | null;
  userId: string;
}

interface Room {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  bookings: Booking[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingForm, setBookingForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
  });
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [draggingBooking, setDraggingBooking] = useState<{ booking: Booking; sourceRoom: Room } | null>(null);
  const [dropTargetRoom, setDropTargetRoom] = useState<string | null>(null);
  const [resizingBooking, setResizingBooking] = useState<{
    booking: Booking;
    room: Room;
    handle: 'start' | 'end';
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const loadRooms = () => {
    if (!session) return;
    const dateString = selectedDate.toISOString().split('T')[0];
    fetch(`/api/rooms?date=${dateString}`, { cache: 'no-store' })
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

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room);
    setEditingBooking(null);
    setShowBookingModal(true);
    setBookingError(null);
    // Set booking form date to currently selected date
    setBookingForm({
      title: '',
      description: '',
      date: selectedDate.toISOString().split('T')[0],
      startTime: '',
      endTime: '',
    });
  };

  const handleEditBooking = (booking: Booking, room: Room) => {
    setEditingBooking(booking);
    setSelectedRoom(room);
    setShowBookingModal(true);
    setBookingError(null);
    
    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end);
    
    setBookingForm({
      title: booking.title,
      description: booking.description || '',
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
    });
  };

  const handleDeleteBooking = async () => {
    if (!editingBooking || !confirm('Weet je zeker dat je deze booking wilt verwijderen?')) return;

    try {
      const res = await fetch(`/api/bookings/${editingBooking.id}?userEmail=${encodeURIComponent(session?.user?.email || '')}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete booking');
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setEditingBooking(null);
        setSelectedRoom(null);
        setBookingSuccess(false);
        loadRooms();
      }, 1500);
    } catch (error: any) {
      setBookingError(error.message);
    }
  };

  const handleDragStart = (booking: Booking, room: Room, e: React.DragEvent) => {
    e.stopPropagation();
    setDraggingBooking({ booking, sourceRoom: room });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', booking.id);
  };

  const handleDragOver = (roomId: string, e: React.DragEvent) => {
    if (!draggingBooking) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetRoom(roomId);
  };

  const handleDragLeave = (roomId: string) => {
    if (dropTargetRoom === roomId) {
      setDropTargetRoom(null);
    }
  };

  const handleDrop = async (targetRoom: Room, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingBooking || !session?.user?.email) {
      setDraggingBooking(null);
      setDropTargetRoom(null);
      return;
    }

    const { booking, sourceRoom } = draggingBooking;

    // Get the drop position relative to the time grid
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = x / rect.width; // 0 to 1
    
    // Calculate which time slot was clicked (6:00 to 22:00 = 16 hours)
    const startHour = 6;
    const endHour = 22;
    const totalHours = endHour - startHour;
    
    // Calculate the new start time based on drop position
    const clickedHour = startHour + (relativeX * totalHours);
    
    // Snap to 15-minute intervals
    const totalMinutesFromStart = clickedHour * 60;
    const snappedMinutes = Math.round(totalMinutesFromStart / 15) * 15;
    const clickedHourFloor = Math.floor(snappedMinutes / 60);
    const clickedMinutes = snappedMinutes % 60;
    
    // Calculate booking duration
    const originalStart = new Date(booking.start);
    const originalEnd = new Date(booking.end);
    const durationMs = originalEnd.getTime() - originalStart.getTime();
    
    // Create new start time - use the booking's original date to preserve the day
    const newStart = new Date(booking.start);
    newStart.setHours(clickedHourFloor, clickedMinutes, 0, 0);
    
    // Create new end time (preserve duration)
    const newEnd = new Date(newStart.getTime() + durationMs);
    
    // Check if new times are within business hours
    const newStartHour = newStart.getHours() + newStart.getMinutes() / 60;
    const newEndHour = newEnd.getHours() + newEnd.getMinutes() / 60;
    
    if (newStartHour < startHour || newEndHour > endHour) {
      alert(t('bookingOutsideBusinessHours') || 'Booking moet binnen werktijden vallen (6:00-22:00)');
      setDraggingBooking(null);
      setDropTargetRoom(null);
      return;
    }

    try {
      // Update booking with new room and/or time
      const updateData: any = {
        userEmail: session.user.email,
      };
      
      // Only update room if it changed
      if (sourceRoom.id !== targetRoom.id) {
        updateData.roomId = targetRoom.id;
      }
      
      // Always update time based on drop position
      updateData.start = newStart.toISOString();
      updateData.end = newEnd.toISOString();

      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to move booking');
      }

      // Success - reload rooms
      loadRooms();
    } catch (error: any) {
      alert(`Kon booking niet verplaatsen: ${error.message}`);
    } finally {
      setDraggingBooking(null);
      setDropTargetRoom(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingBooking(null);
    setDropTargetRoom(null);
  };

  const handleResizeStart = (booking: Booking, room: Room, handle: 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    setResizingBooking({
      booking,
      room,
      handle,
      originalStart: new Date(booking.start),
      originalEnd: new Date(booking.end),
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingBooking) return;

    const timelineElement = document.querySelector(`[data-room-id="${resizingBooking.room.id}"]`);
    if (!timelineElement) return;

    const rect = timelineElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    // Convert percentage to time (6:00 - 23:00 = 17 hours)
    const totalMinutes = (percentage / 100) * 17 * 60;
    const hour = Math.floor(totalMinutes / 60) + 6;
    const minute = Math.round((totalMinutes % 60) / 15) * 15; // Round to 15 min intervals

    const newDate = new Date(resizingBooking.originalStart);
    newDate.setHours(hour, minute, 0, 0);

    // Update the booking in state temporarily for visual feedback
    const updatedRooms = rooms.map(room => {
      if (room.id === resizingBooking.room.id) {
        return {
          ...room,
          bookings: room.bookings.map(b => {
            if (b.id === resizingBooking.booking.id) {
              if (resizingBooking.handle === 'start') {
                // Don't allow start to go past end
                if (newDate < new Date(b.end)) {
                  return { ...b, start: newDate.toISOString() };
                }
              } else {
                // Don't allow end to go before start
                if (newDate > new Date(b.start)) {
                  return { ...b, end: newDate.toISOString() };
                }
              }
            }
            return b;
          }),
        };
      }
      return room;
    });
    setRooms(updatedRooms);
  };

  const handleResizeEnd = async () => {
    if (!resizingBooking || !session?.user?.email) {
      setResizingBooking(null);
      return;
    }

    const currentBooking = rooms
      .find(r => r.id === resizingBooking.room.id)
      ?.bookings.find(b => b.id === resizingBooking.booking.id);

    if (!currentBooking) {
      setResizingBooking(null);
      return;
    }

    const newStart = new Date(currentBooking.start);
    const newEnd = new Date(currentBooking.end);

    // Check if times actually changed
    if (
      newStart.getTime() === resizingBooking.originalStart.getTime() &&
      newEnd.getTime() === resizingBooking.originalEnd.getTime()
    ) {
      setResizingBooking(null);
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${resizingBooking.booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
          userEmail: session.user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resize booking');
      }

      // Success - reload rooms
      loadRooms();
    } catch (error: any) {
      alert(`Kon booking niet aanpassen: ${error.message}`);
      // Reload to revert changes
      loadRooms();
    } finally {
      setResizingBooking(null);
    }
  };

  // Add global mouse event listeners for resize
  useEffect(() => {
    if (resizingBooking) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
      const handleMouseUp = () => handleResizeEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingBooking, rooms]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    setBookingError(null);
    
    try {
      const start = new Date(`${bookingForm.date}T${bookingForm.startTime}`);
      const end = new Date(`${bookingForm.date}T${bookingForm.endTime}`);

      let res;
      if (editingBooking) {
        // Update existing booking
        res = await fetch(`/api/bookings/${editingBooking.id}`, {
          method: 'PATCH',
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
      } else {
        // Create new booking
        res = await fetch('/api/bookings', {
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
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${editingBooking ? 'update' : 'create'} booking`);
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setSelectedRoom(null);
        setEditingBooking(null);
        setBookingSuccess(false);
        setBookingForm({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: '',
        });
        loadRooms();
      }, 2000);
    } catch (error: any) {
      setBookingError(error.message);
    }
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('nl-NL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
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
  }, [session, selectedDate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-gray-900 font-semibold">{t('loading')}</p>
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
            <h1 className="text-2xl font-bold">{t('roomsAvailability')}</h1>
          </div>
          <div className="flex gap-4 items-center flex-wrap">
            {/* Date Navigation */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2">
              <button
                onClick={goToPreviousDay}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
                title="Vorige dag"
              >
                ←
              </button>
              
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  className="bg-white/10 text-white border border-white/40 rounded-lg px-3 py-1.5 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
                />
                
                {!isToday(selectedDate) && (
                  <button
                    onClick={goToToday}
                    className="bg-cyan-400/60 hover:bg-cyan-500/70 backdrop-blur-md border border-cyan-300/40 text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm whitespace-nowrap min-w-[110px]"
                  >
                    📅 {t('today')}
                  </button>
                )}
              </div>

              <button
                onClick={goToNextDay}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
                title="Volgende dag"
              >
                →
              </button>
            </div>

            <button
              onClick={() => router.push('/floor-plan')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 min-w-[140px] whitespace-nowrap"
            >
              🗺️ {t('floorPlan')}
            </button>
            {session?.user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 min-w-[110px]"
              >
                👨‍💼 Admin
              </button>
            )}
            <button
              onClick={() => router.push('/my-bookings')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 min-w-[140px] whitespace-nowrap"
            >
              📅 {t('myBookings')}
            </button>
            <button
              onClick={() => router.push('/auth/signout')}
              className="bg-red-500/60 hover:bg-red-500/80 backdrop-blur-md border border-red-400/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 min-w-[130px] whitespace-nowrap"
            >
              🚪 {t('signOut')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Date Display Card */}
        <div className="bg-gradient-to-br from-teal-900 to-cyan-900 rounded-xl shadow-2xl p-6 mb-6 border-2 border-teal-400">
          <h2 className="text-3xl font-bold text-white mb-2">📅 {t('roomsAvailability')}</h2>
          <p className="text-teal-200 text-lg">
            {formatDisplayDate(selectedDate)}
            {isToday(selectedDate) && <span className="ml-2 text-cyan-300 font-semibold">({t('today')})</span>}
          </p>
        </div>

        {loading ? (
          <div className="bg-gradient-to-br from-teal-900/50 to-cyan-900/50 rounded-xl shadow-lg p-12 text-center border border-teal-400/20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-400 mx-auto mb-4"></div>
            <p className="text-white font-semibold text-lg">{t('loadingRooms')}</p>
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
                    const bookingsWithPositions = (room.bookings || []).map((booking) => {
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
                    });

                    return (
                      <tr 
                        key={room.id} 
                        className={`hover:bg-teal-900/20 transition-colors border-b border-teal-400/10 ${
                          dropTargetRoom === room.id ? 'bg-cyan-500/20 ring-2 ring-cyan-400' : ''
                        }`}
                      >
                        <td className="border border-teal-400/20 p-4 sticky left-0 bg-gradient-to-br from-teal-900/40 to-cyan-900/40 z-10 border-r-2 border-teal-400/30">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-white text-lg">{room.name}</div>
                              <div className="text-sm text-teal-300 font-medium">{room.location}</div>
                              <div className="text-sm text-cyan-300 font-semibold">👥 {room.capacity} {t('people')}</div>
                            </div>
                            <button
                              onClick={() => handleBookRoom(room)}
                              className="bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500/90 hover:to-cyan-500/90 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 min-w-[85px] whitespace-nowrap"
                            >
                              📅 {t('book')}
                            </button>
                          </div>
                        </td>
                        <td 
                          colSpan={timeSlots.length} 
                          className={`border border-teal-400/20 p-0 relative h-16 transition-colors ${
                            dropTargetRoom === room.id 
                              ? 'bg-gradient-to-br from-cyan-500/30 to-teal-500/30' 
                              : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10'
                          }`}
                          data-room-id={room.id}
                          onDragOver={(e) => handleDragOver(room.id, e)}
                          onDragLeave={() => handleDragLeave(room.id)}
                          onDrop={(e) => handleDrop(room, e)}
                        >
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
                          {bookingsWithPositions.map((booking, idx) => {
                            const isOwner = booking.userId === session?.user?.id;
                            const isDragging = draggingBooking?.booking.id === booking.id;
                            const isResizing = resizingBooking?.booking.id === booking.id;
                            return (
                              <div
                                key={booking.id}
                                draggable={isOwner && !isResizing}
                                onDragStart={(e) => isOwner && !isResizing && handleDragStart(booking, room, e)}
                                onDragEnd={handleDragEnd}
                                onClick={() => isOwner && !isDragging && !isResizing && handleEditBooking(booking, room)}
                                className={`absolute top-1 bottom-1 bg-gradient-to-r from-red-500/80 to-pink-500/80 backdrop-blur-sm border-2 border-red-400/40 rounded-lg shadow-lg flex items-center justify-center overflow-visible group hover:shadow-xl transition-all ${
                                  isOwner ? 'cursor-move hover:scale-105 hover:border-red-300' : 'cursor-default'
                                } ${isDragging ? 'opacity-50 scale-95' : ''} ${isResizing ? 'ring-2 ring-yellow-400' : ''}`}
                                style={{
                                  left: `${booking.startPos}%`,
                                  width: `${booking.width}%`,
                                  zIndex: isResizing ? 50 : 10 + idx,
                                }}
                                title={`${booking.title}\n${booking.startTime} - ${booking.endTime}${isOwner ? '\n\nKlik: bewerken | Sleep: verplaats room | Randen: aanpassen tijd' : ''}`}
                              >
                                {/* Left resize handle */}
                                {isOwner && (
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-yellow-400/50 transition-colors z-10"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleResizeStart(booking, room, 'start', e);
                                    }}
                                    title="Sleep om starttijd aan te passen"
                                  >
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-400/70 rounded-r" />
                                  </div>
                                )}

                                <div className="text-white text-xs font-bold px-2 truncate flex items-center gap-1 pointer-events-none">
                                  {isOwner && booking.width > 5 && (
                                    <span className="text-yellow-300">✏️</span>
                                  )}
                                  {booking.width > 8 && (
                                    <span>{booking.startTime} - {booking.endTime}</span>
                                  )}
                                  {booking.width > 15 && (
                                    <span className="ml-2">• {booking.title}</span>
                                  )}
                                </div>

                                {/* Right resize handle */}
                                {isOwner && (
                                  <div
                                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-yellow-400/50 transition-colors z-10"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleResizeStart(booking, room, 'end', e);
                                    }}
                                    title="Sleep om eindtijd aan te passen"
                                  >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-400/70 rounded-l" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Show "Free" if no bookings */}
                          {bookingsWithPositions.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                              ✓ {t('available')}
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

      {/* Quick Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gradient-to-br from-teal-900 to-cyan-900 rounded-xl shadow-2xl max-w-lg w-full border-2 border-teal-400">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {editingBooking ? `✏️ ${t('editBooking')}` : `📅 ${t('bookRoom')}`} {selectedRoom.name}
                  </h2>
                  <p className="text-teal-200 text-sm">{selectedRoom.location} • 👥 {selectedRoom.capacity} {t('people')}</p>
                </div>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setEditingBooking(null);
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
                  <p className="text-white font-bold text-xl">{t('bookingSuccessful')}</p>
                  <p className="text-teal-200 mt-2">{t('bookingConfirmed')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  {bookingError && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                      ⚠️ {bookingError}
                    </div>
                  )}

                  <div>
                    <label className="block text-white font-semibold mb-2">{t('title')} *</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.title}
                      onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border-2 border-teal-400 bg-white/10 text-white placeholder-teal-300 focus:outline-none focus:border-cyan-400"
                      placeholder={t('titlePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">{t('description')}</label>
                    <textarea
                      value={bookingForm.description}
                      onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border-2 border-teal-400 bg-white/10 text-white placeholder-teal-300 focus:outline-none focus:border-cyan-400 resize-none"
                      rows={3}
                      placeholder={t('descriptionPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">{t('date')} *</label>
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
                      <label className="block text-white font-semibold mb-2">{t('startTime')} *</label>
                      <input
                        type="time"
                        required
                        value={bookingForm.startTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-teal-400 bg-white/10 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2">{t('endTime')} *</label>
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
                    {editingBooking && (
                      <button
                        type="button"
                        onClick={handleDeleteBooking}
                        className="bg-red-500/60 hover:bg-red-600/70 backdrop-blur-md border border-red-400/30 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        🗑️
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500/90 hover:to-cyan-500/90 backdrop-blur-md border border-white/30 text-white font-bold py-3 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                    >
                      {editingBooking ? `💾 ${t('save')}` : `✅ ${t('confirm')}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingModal(false);
                        setEditingBooking(null);
                        setBookingError(null);
                      }}
                      className="flex-1 bg-gray-600/60 hover:bg-gray-700/70 backdrop-blur-md border border-gray-400/30 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Language Selector */}
      <LanguageSelector />
    </main>
  );
}
