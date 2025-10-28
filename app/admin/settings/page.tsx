'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SystemSettings() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    enableBookings: true,
    requireApproval: false,
    maxBookingDuration: 120,
    maxAdvanceBooking: 30,
  });

  if (!session || session.user.role !== 'ADMIN') {
    router.push('/dashboard');
    return null;
  }

  const handleSave = () => {
    alert('Settings saved (not yet fully implemented)');
  };

  return (
    <main className="p-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <button
            onClick={() => router.push('/admin')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Booking Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold">Enable Bookings</label>
                  <p className="text-sm text-gray-600">Allow users to make room bookings</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableBookings}
                  onChange={(e) => setSettings({ ...settings, enableBookings: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Max Booking Duration (minutes)</label>
                <input
                  type="number"
                  value={settings.maxBookingDuration}
                  onChange={(e) => setSettings({ ...settings, maxBookingDuration: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Max Advance Booking (days)</label>
                <input
                  type="number"
                  value={settings.maxAdvanceBooking}
                  onChange={(e) => setSettings({ ...settings, maxAdvanceBooking: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Microsoft Graph Integration</h2>
            <p className="text-sm text-gray-600 mb-2">Permissions configured:</p>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Calendars.ReadWrite</li>
              <li>• MailboxSettings.Read</li>
              <li>• Place.Read.All</li>
            </ul>
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <a href="https://portal.azure.com" target="_blank" className="text-blue-600 text-sm underline">
                Configure in Azure Portal →
              </a>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
