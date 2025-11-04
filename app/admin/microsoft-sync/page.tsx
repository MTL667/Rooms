'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SyncResult {
  success: boolean;
  totalRooms: number;
  created: number;
  updated: number;
  errors: string[];
}

export default function MicrosoftSyncPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!session?.user?.email) {
      setError('Not authenticated');
      return;
    }

    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/admin/microsoft/sync-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: session.user.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setSyncResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSyncing(false);
    }
  };

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">Access Denied</p>
          <p className="text-gray-600 mt-2">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 text-white py-4 px-6 rounded-xl mb-6 shadow-xl border border-teal-400/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">☁️ Microsoft Entra Sync</h1>
              <p className="text-teal-100 text-sm mt-1">Synchroniseer meeting rooms vanuit Microsoft Entra</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              ⬅️ Back
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
            <span>ℹ️</span> Wat doet deze sync?
          </h2>
          <ul className="text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-teal-500 font-bold mt-1">•</span>
              <span>Haalt alle meeting rooms op uit Microsoft Entra (Azure AD)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 font-bold mt-1">•</span>
              <span>Maakt nieuwe rooms aan als ze nog niet bestaan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 font-bold mt-1">•</span>
              <span>Update bestaande rooms met nieuwe informatie (naam, capaciteit, locatie)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 font-bold mt-1">•</span>
              <span>Koppelt room email adressen voor calendar synchronisatie</span>
            </li>
          </ul>
        </div>

        {/* Sync Button */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-xl p-8 text-center border-2 border-teal-200 mb-6">
          <div className="text-6xl mb-4">☁️</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Sync?</h3>
          <p className="text-gray-700 mb-6">
            Klik op de knop hieronder om te synchroniseren met Microsoft Entra
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {syncing ? (
              <span className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Synchroniseren...
              </span>
            ) : (
              '🔄 Start Synchronisatie'
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <h3 className="font-bold text-red-900 mb-2">Sync Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {syncResult && syncResult.success && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <h3 className="font-bold text-green-900 mb-3">Sync Succesvol!</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                    <div className="text-3xl font-bold text-green-600">{syncResult.totalRooms}</div>
                    <div className="text-sm text-gray-600 font-semibold">Totaal Gevonden</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                    <div className="text-3xl font-bold text-blue-600">{syncResult.created}</div>
                    <div className="text-sm text-gray-600 font-semibold">Nieuw Aangemaakt</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                    <div className="text-3xl font-bold text-orange-600">{syncResult.updated}</div>
                    <div className="text-sm text-gray-600 font-semibold">Geüpdatet</div>
                  </div>
                </div>

                {syncResult.errors.length > 0 && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                    <h4 className="font-bold text-yellow-900 mb-2">⚠️ Warnings ({syncResult.errors.length})</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {syncResult.errors.map((err, idx) => (
                        <li key={idx} className="break-all">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => router.push('/admin/rooms')}
                    className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    📋 Bekijk Rooms
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="bg-white border-2 border-teal-400 text-teal-600 hover:bg-teal-50 font-bold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    🔄 Sync Opnieuw
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="font-bold text-lg text-gray-900 mb-3">📖 Hoe werkt het?</h3>
          <ol className="text-gray-700 space-y-3">
            <li className="flex items-start gap-3">
              <span className="bg-teal-400 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0">1</span>
              <div>
                <strong>Microsoft Entra Verbinding</strong>
                <p className="text-sm">De app gebruikt je Azure AD credentials om in te loggen bij Microsoft Graph API</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-teal-400 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0">2</span>
              <div>
                <strong>Rooms Ophalen</strong>
                <p className="text-sm">Alle room resources worden opgehaald uit je tenant (via /places API)</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-teal-400 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0">3</span>
              <div>
                <strong>Database Update</strong>
                <p className="text-sm">Nieuwe rooms worden aangemaakt, bestaande rooms worden geüpdatet</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-teal-400 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0">4</span>
              <div>
                <strong>Calendar Sync</strong>
                <p className="text-sm">Rooms met msResourceEmail krijgen automatisch calendar sync voor bookings</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}

