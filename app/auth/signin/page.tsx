'use client';

import { signIn } from "next-auth/react";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-xl p-8 border-2 border-teal-200">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Room Booking</h1>
          <p className="text-gray-600">
            Sign in to book rooms and view availability
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              setLoading(true);
              signIn('azure-ad');
            }}
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-400/80 via-cyan-400/80 to-teal-400/80 hover:from-teal-500/90 hover:via-cyan-500/90 hover:to-teal-500/90 backdrop-blur-md border border-white/30 text-white py-3 px-4 rounded-xl transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-105"
          >
            {loading ? 'Connecting...' : '🔐 Sign in with Microsoft'}
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mt-6 text-center">
          Sign in with your Microsoft account to access the room booking system.
        </p>
      </div>
    </main>
  );
}
