'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type TenantStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Tenant {
  id: string;
  tenantId: string;
  name: string | null;
  active: boolean;
  status: TenantStatus;
  createdAt: string;
}

export default function TenantsManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ tenantId: '', name: '', active: true, status: 'APPROVED' as TenantStatus });

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadTenants();
  }, [session, router]);

  const loadTenants = async () => {
    try {
      const res = await fetch('/api/admin/tenants');
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      loadTenants();
      setShowForm(false);
      setFormData({ tenantId: '', name: '', active: true, status: 'APPROVED' });
    } catch (error) {
      console.error('Error creating tenant:', error);
    }
  };

  const toggleTenant = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      loadTenants();
    } catch (error) {
      console.error('Error toggling tenant:', error);
    }
  };

  const updateTenantStatus = async (id: string, status: TenantStatus) => {
    try {
      await fetch(`/api/admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, active: status === 'APPROVED' }),
      });
      loadTenants();
    } catch (error) {
      console.error('Error updating tenant status:', error);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
    </div>
  );

  const pendingCount = tenants.filter(t => t.status === 'PENDING').length;

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 text-white py-4 px-6 rounded-xl mb-6 shadow-xl border border-teal-400/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🏢 Tenant Management</h1>
              <p className="text-teal-100 text-sm mt-1">Beheer organisatie toegang</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                ➕ Add Tenant
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                ⬅️ Back
              </button>
            </div>
          </div>
        </div>

        {/* Pending Alert */}
        {pendingCount > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-amber-400 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                {pendingCount}
              </div>
              <div>
                <p className="font-bold text-amber-900">
                  {pendingCount} {pendingCount === 1 ? 'tenant wacht' : 'tenants wachten'} op goedkeuring
                </p>
                <p className="text-sm text-amber-700">Review en approve nieuwe organisaties hieronder</p>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-xl p-6 mb-6 border-2 border-teal-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">➕ Nieuwe Tenant Toevoegen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">Tenant ID *</label>
                <input
                  type="text"
                  value={formData.tenantId}
                  onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  className="w-full border-2 border-teal-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500 bg-white"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">Naam</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border-2 border-teal-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500 bg-white"
                  placeholder="Bedrijfsnaam"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TenantStatus })}
                  className="w-full border-2 border-teal-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="APPROVED">✅ Approved (Direct toegang)</option>
                  <option value="PENDING">⏳ Pending (Wacht op goedkeuring)</option>
                  <option value="REJECTED">❌ Rejected (Geen toegang)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded w-5 h-5 border-2 border-teal-300 text-teal-500 focus:ring-teal-500"
                />
                <label className="text-sm font-semibold text-gray-900">Active (Users kunnen inloggen)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  ✓ Create Tenant
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-xl overflow-hidden border-2 border-teal-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-teal-400 to-cyan-400">
              <tr>
                <th className="p-4 text-left text-white font-bold">Tenant ID</th>
                <th className="p-4 text-left text-white font-bold">Name</th>
                <th className="p-4 text-left text-white font-bold">Approval Status</th>
                <th className="p-4 text-left text-white font-bold">Active</th>
                <th className="p-4 text-left text-white font-bold">Datum</th>
                <th className="p-4 text-left text-white font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {tenants.sort((a, b) => {
                // Pending first
                if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }).map((tenant) => (
                <tr key={tenant.id} className={`border-t-2 border-teal-100 hover:bg-teal-50/50 transition-colors ${tenant.status === 'PENDING' ? 'bg-amber-50/30' : ''}`}>
                  <td className="p-4 font-mono text-xs text-gray-700">{tenant.tenantId.slice(0, 8)}...</td>
                  <td className="p-4 font-semibold text-gray-900">{tenant.name || 'Unnamed'}</td>
                  <td className="p-4">
                    {tenant.status === 'PENDING' && (
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800 border-2 border-amber-300 inline-flex items-center gap-1">
                        ⏳ Pending
                      </span>
                    )}
                    {tenant.status === 'APPROVED' && (
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 border-2 border-green-300 inline-flex items-center gap-1">
                        ✅ Approved
                      </span>
                    )}
                    {tenant.status === 'REJECTED' && (
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 border-2 border-red-300 inline-flex items-center gap-1">
                        ❌ Rejected
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${tenant.active ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'}`}>
                      {tenant.active ? '✓ Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(tenant.createdAt).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 flex-wrap">
                      {tenant.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updateTenantStatus(tenant.id, 'APPROVED')}
                            className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold px-3 py-1 rounded-lg text-sm transition-all shadow-md hover:shadow-lg hover:scale-105"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => updateTenantStatus(tenant.id, 'REJECTED')}
                            className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold px-3 py-1 rounded-lg text-sm transition-all shadow-md hover:shadow-lg hover:scale-105"
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      {tenant.status === 'REJECTED' && (
                        <button
                          onClick={() => updateTenantStatus(tenant.id, 'APPROVED')}
                          className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold px-3 py-1 rounded-lg text-sm transition-all shadow-md hover:shadow-lg hover:scale-105"
                        >
                          ✅ Approve
                        </button>
                      )}
                      {tenant.status === 'APPROVED' && (
                        <button
                          onClick={() => toggleTenant(tenant.id, tenant.active)}
                          className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold px-3 py-1 rounded-lg text-sm transition-all shadow-md hover:shadow-lg hover:scale-105"
                        >
                          {tenant.active ? '○ Deactivate' : '✓ Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tenants.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <p className="text-gray-500 font-semibold">Nog geen tenants</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
