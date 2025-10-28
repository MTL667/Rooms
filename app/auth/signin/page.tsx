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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
        <p className="text-gray-600 mb-8">
          Sign in to book rooms and view availability
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              setLoading(true);
              signIn('azure-ad');
            }}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : '🔐 Sign in with Microsoft'}
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mt-6 text-center">
          Sign in with your Microsoft account to access the room booking system.
        </p>
      </div>
    </main>
  );
}
