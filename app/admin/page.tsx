'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => router.push('/admin/tenants')}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow p-6 text-left transition-colors"
          >
            <div className="text-2xl font-semibold mb-2">🧑‍💼 Tenants</div>
            <p className="text-purple-100">
              Manage allowed Azure AD tenants
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/users')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow p-6 text-left transition-colors"
          >
            <div className="text-2xl font-semibold mb-2">👥 Users</div>
            <p className="text-blue-100">
              Manage users and permissions
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/rooms')}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow p-6 text-left transition-colors"
          >
            <div className="text-2xl font-semibold mb-2">🏢 Rooms</div>
            <p className="text-green-100">
              Configure meeting rooms
            </p>
          </button>

          <div className="bg-gray-600 text-white rounded-lg shadow p-6">
            <div className="text-2xl font-semibold mb-2">⚙️ Settings</div>
            <p className="text-gray-300">
              System configuration
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
