'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  active: boolean;
  _count: { rooms: number; allowedTenants: number };
  allowedTenants: Array<{ tenantId: string }>;
}

interface Tenant {
  id: string;
  name: string | null;
  domain: string | null;
}

export default function LocationsManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    active: true,
    tenantIds: [] as string[],
  });

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadLocations();
    loadTenants();
  }, [session, router]);

  const loadLocations = async () => {
    try {
      const res = await fetch(`/api/admin/locations?userEmail=${encodeURIComponent(session?.user?.email || '')}`);
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const res = await fetch(`/api/admin/tenants?userEmail=${encodeURIComponent(session?.user?.email || '')}`);
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const startEdit = (location: Location) => {
    setEditingId(location.id);
    setFormData({
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      country: location.country || '',
      active: location.active,
      tenantIds: location.allowedTenants.map((t) => t.tenantId),
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      country: '',
      active: true,
      tenantIds: [],
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/admin/locations/${editingId}`
        : '/api/admin/locations';

      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userEmail: session?.user?.email,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save location');
      }

      loadLocations();
      cancelEdit();
    } catch (error) {
      console.error('Error saving location:', error);
      alert(`Fout bij het ${editingId ? 'bewerken' : 'aanmaken'} van locatie`);
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm('Locatie verwijderen? Rooms moeten eerst ontkoppeld worden.')) return;
    try {
      const res = await fetch(
        `/api/admin/locations/${id}?userEmail=${encodeURIComponent(session?.user?.email || '')}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete location');
      }

      loadLocations();
    } catch (error: any) {
      console.error('Error deleting location:', error);
      alert(error.message || 'Fout bij het verwijderen van locatie');
    }
  };

  const toggleTenant = (tenantId: string) => {
    setFormData((prev) => ({
      ...prev,
      tenantIds: prev.tenantIds.includes(tenantId)
        ? prev.tenantIds.filter((id) => id !== tenantId)
        : [...prev.tenantIds, tenantId],
    }));
  };

  if (loading) return <div className="p-6 bg-white">Laden...</div>;

  return (
    <main className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📍 Locaties Beheer</h1>
            <p className="text-gray-600 mt-1">Beheer locaties en tenant zichtbaarheid</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (showForm ? cancelEdit() : setShowForm(true))}
              className="bg-gradient-to-r from-purple-400/80 to-pink-400/80 hover:from-purple-500/90 hover:to-pink-500/90 backdrop-blur-md border border-purple-300/30 text-white px-6 py-2 rounded-xl font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {showForm ? '❌ Annuleren' : '➕ Nieuwe Locatie'}
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-200/60 hover:bg-gray-300/70 backdrop-blur-md border border-gray-300/40 text-gray-700 px-6 py-2 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              ⬅️ Terug
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6 shadow-lg border border-purple-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? '✏️ Locatie Bewerken' : '➕ Nieuwe Locatie'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Naam *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Hoofdkantoor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stad</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brussel"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Adres</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Hoofdstraat 123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Land</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="België"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Actief</label>
                <select
                  value={formData.active.toString()}
                  onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="true">Ja</option>
                  <option value="false">Nee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Zichtbaar voor Tenants
                </label>
                <div className="bg-white rounded-lg p-4 border-2 border-purple-200 max-h-64 overflow-y-auto">
                  {tenants.length === 0 ? (
                    <p className="text-gray-500 text-sm">Geen tenants beschikbaar</p>
                  ) : (
                    <div className="space-y-2">
                      {tenants.map((tenant) => (
                        <label
                          key={tenant.id}
                          className="flex items-center gap-3 p-2 hover:bg-purple-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.tenantIds.includes(tenant.id)}
                            onChange={() => toggleTenant(tenant.id)}
                            className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {tenant.name || tenant.domain || 'Unnamed Tenant'}
                            </div>
                            {tenant.domain && (
                              <div className="text-xs text-gray-500">{tenant.domain}</div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Alleen geselecteerde tenants kunnen deze locatie en de bijbehorende rooms zien
                </p>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-400/80 to-pink-400/80 hover:from-purple-500/90 hover:to-pink-500/90 backdrop-blur-md border border-white/30 text-white font-bold py-3 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                {editingId ? '💾 Bijwerken' : '💾 Opslaan'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <th className="px-6 py-4 text-left font-bold">Naam</th>
                <th className="px-6 py-4 text-left font-bold">Stad</th>
                <th className="px-6 py-4 text-left font-bold">Land</th>
                <th className="px-6 py-4 text-left font-bold">Rooms</th>
                <th className="px-6 py-4 text-left font-bold">Tenants</th>
                <th className="px-6 py-4 text-left font-bold">Status</th>
                <th className="px-6 py-4 text-left font-bold">Acties</th>
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="text-6xl mb-4">📍</div>
                    <p className="text-xl font-semibold">Nog geen locaties</p>
                    <p className="text-gray-400 mt-2">Klik op "Nieuwe Locatie" om te beginnen</p>
                  </td>
                </tr>
              ) : (
                locations.map((location) => (
                  <tr
                    key={location.id}
                    className="border-b border-gray-200 hover:bg-purple-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{location.name}</div>
                      {location.address && (
                        <div className="text-sm text-gray-500">{location.address}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{location.city || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{location.country || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {location._count.rooms} rooms
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {location._count.allowedTenants} tenants
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          location.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {location.active ? '✅ Actief' : '⏸️ Inactief'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(location)}
                          className="bg-blue-500/60 hover:bg-blue-600/70 backdrop-blur-md border border-blue-400/30 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          ✏️ Bewerken
                        </button>
                        <button
                          onClick={() => deleteLocation(location.id)}
                          className="bg-red-500/60 hover:bg-red-600/70 backdrop-blur-md border border-red-400/30 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          🗑️ Verwijderen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

