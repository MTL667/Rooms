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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-900">Loading...</p>
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 font-semibold"
          >
            Dashboard
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => router.push('/admin/tenants')}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow p-6 text-left transition-colors"
          >
            <div className="text-2xl font-semibold mb-2">🧑‍💼 Tenants</div>
            <p className="text-purple-100 text-sm">
              Manage allowed Azure AD tenants
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/users')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow p-6 text-left transition-colors"
          >
            <div className="text-2xl font-semibold mb-2">👥 Users</div>
            <p className="text-blue-100 text-sm">
              Manage users and permissions
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/rooms')}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow p-6 text-left transition-colors"
          >
            <div className="text-2xl font-semibold mb-2">🏢 Rooms</div>
            <p className="text-green-100 text-sm">
              Configure meeting rooms
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/floor-plans')}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow p-6 text-left transition-colors"
          >
            <div className="text-2xl font-semibold mb-2">🗺️ Floor Plans</div>
            <p className="text-teal-100 text-sm">
              Manage building floor plans
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/branding')}
            className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg shadow p-6 text-left transition-colors"
          >
            <div className="text-2xl font-semibold mb-2">🎨 Branding</div>
            <p className="text-pink-100 text-sm">
              Upload custom logo and branding
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/settings')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow p-6 text-left transition-colors"
          >
            <div className="text-2xl font-semibold mb-2">⚙️ Settings</div>
            <p className="text-indigo-100 text-sm">
              System configuration
            </p>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">System Info</h2>
          <p className="text-gray-700 text-sm">
            Logged in as: <strong className="text-gray-900">{session?.user?.email}</strong>
          </p>
          <p className="text-gray-700 text-sm">
            Role: <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">{session?.user?.role}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
