'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Booking {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  description?: string;
  room: {
    name: string;
  };
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      CONFIRMED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  const upcomingBookings = bookings.filter(b => new Date(b.end) > new Date());
  const pastBookings = bookings.filter(b => new Date(b.end) <= new Date());

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <Link href="/rooms" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Book a Room
          </Link>
        </div>
        
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 mb-4">You have no bookings yet.</p>
            <Link href="/rooms" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Book Your First Room
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Upcoming</h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{booking.title}</h3>
                          <p className="text-gray-600 mb-2">{booking.room?.name}</p>
                          <p className="text-sm text-gray-500">
                            📅 {new Date(booking.start).toLocaleDateString()} 
                            {' '} {new Date(booking.start).toLocaleTimeString()} 
                            - {new Date(booking.end).toLocaleTimeString()}
                          </p>
                          {booking.description && (
                            <p className="text-gray-600 mt-3 italic">{booking.description}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Past</h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 opacity-75">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{booking.title}</h3>
                          <p className="text-gray-600 mb-2">{booking.room?.name}</p>
                          <p className="text-sm text-gray-500">
                            📅 {new Date(booking.start).toLocaleDateString()} 
                            {' '} {new Date(booking.start).toLocaleTimeString()} 
                            - {new Date(booking.end).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(booking.status)}`}>
                          {booking.status}
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
