'use client';

import { signOut } from "next-auth/react";
import { useEffect } from 'react';

export default function SignOut() {
  useEffect(() => {
    signOut({ callbackUrl: '/auth/signin' });
  }, []);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-xl p-8 border-2 border-teal-200">
        <div className="text-center">
          <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Signing Out...</h1>
          <p className="text-gray-600">
            You are being signed out. Please wait...
          </p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
          </div>
        </div>
      </div>
    </main>
  );
}

