'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FloorPlan {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  imageUrl: string;
  active: boolean;
  createdAt: string;
  _count: { rooms: number };
}

export default function FloorPlansManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: '',
    imageUrl: '',
    active: true,
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadFloorPlans();
  }, [session, router]);

  const loadFloorPlans = async () => {
    try {
      const res = await fetch('/api/admin/floor-plans');
      const data = await res.json();
      setFloorPlans(data.floorPlans || []);
    } catch (error) {
      console.error('Error loading floor plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const startEdit = (fp: FloorPlan) => {
    setEditingId(fp.id);
    setFormData({
      name: fp.name,
      building: fp.building || '',
      floor: fp.floor || '',
      imageUrl: fp.imageUrl,
      active: fp.active,
    });
    setPreviewUrl(fp.imageUrl);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', building: '', floor: '', imageUrl: '', active: true });
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrl = formData.imageUrl;

      // If a file is selected, upload it first
      if (selectedFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('type', 'floorplans');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Upload failed');
        }

        imageUrl = uploadData.url;
        setUploading(false);
      }

      if (!imageUrl) {
        alert('Geen afbeelding geselecteerd');
        return;
      }

      const url = editingId 
        ? `/api/admin/floor-plans/${editingId}`
        : '/api/admin/floor-plans';
      
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save floor plan');
      }
      
      loadFloorPlans();
      cancelEdit();
    } catch (error) {
      console.error('Error saving floor plan:', error);
      alert(`Fout bij het ${editingId ? 'bewerken' : 'aanmaken'} van plattegrond`);
      setUploading(false);
    }
  };

  const deleteFloorPlan = async (id: string) => {
    if (!confirm('Plattegrond verwijderen? Dit zal de koppeling met rooms verwijderen.')) return;
    try {
      await fetch(`/api/admin/floor-plans/${id}`, { method: 'DELETE' });
      loadFloorPlans();
    } catch (error) {
      console.error('Error deleting floor plan:', error);
    }
  };

  if (loading) return <div className="p-6 bg-white">Laden...</div>;

  return (
    <main className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plattegronden Beheer</h1>
            <p className="text-gray-600 mt-1">Beheer gebouw plattegronden voor room visualisatie</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => showForm ? cancelEdit() : setShowForm(true)}
              className="bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500/90 hover:to-cyan-500/90 backdrop-blur-md border border-teal-300/30 text-white px-6 py-2 rounded-xl font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {showForm ? '❌ Annuleren' : '➕ Nieuwe Plattegrond'}
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
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 mb-6 shadow-lg border border-teal-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? '✏️ Plattegrond Bewerken' : '➕ Nieuwe Plattegrond'}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Bijvoorbeeld: Hoofdgebouw Verdieping 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gebouw</label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Hoofdgebouw"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Verdieping</label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Actief</label>
                  <select
                    value={formData.active.toString()}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="true">Ja</option>
                    <option value="false">Nee</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Plattegrond Afbeelding *
                </label>
                <div className="border-2 border-dashed border-teal-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="floor-plan-upload"
                  />
                  <label 
                    htmlFor="floor-plan-upload" 
                    className="cursor-pointer block"
                  >
                    {previewUrl ? (
                      <div className="space-y-2">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-48 mx-auto rounded"
                        />
                        <p className="text-sm text-gray-600">
                          {selectedFile?.name}
                        </p>
                        <p className="text-xs text-teal-600 font-semibold">
                          Klik om een andere afbeelding te kiezen
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-6xl mb-2">📤</div>
                        <p className="text-gray-700 font-semibold mb-1">
                          Klik om een afbeelding te uploaden
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, GIF of WebP (max 10MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={uploading || (!selectedFile && !formData.imageUrl)}
                className="w-full bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500/90 hover:to-cyan-500/90 disabled:from-gray-400/60 disabled:to-gray-500/60 disabled:cursor-not-allowed backdrop-blur-md border border-white/30 text-white font-bold py-3 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                {uploading ? '⏳ Uploaden...' : editingId ? '💾 Bijwerken' : '💾 Opslaan'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                <th className="px-6 py-4 text-left font-bold">Preview</th>
                <th className="px-6 py-4 text-left font-bold">Naam</th>
                <th className="px-6 py-4 text-left font-bold">Gebouw</th>
                <th className="px-6 py-4 text-left font-bold">Verdieping</th>
                <th className="px-6 py-4 text-left font-bold">Rooms</th>
                <th className="px-6 py-4 text-left font-bold">Status</th>
                <th className="px-6 py-4 text-left font-bold">Acties</th>
              </tr>
            </thead>
            <tbody>
              {floorPlans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="text-6xl mb-4">🗺️</div>
                    <p className="text-xl font-semibold">Nog geen plattegronden</p>
                    <p className="text-gray-400 mt-2">Klik op "Nieuwe Plattegrond" om te beginnen</p>
                  </td>
                </tr>
              ) : (
                floorPlans.map((fp) => (
                  <tr key={fp.id} className="border-b border-gray-200 hover:bg-teal-50 transition-colors">
                    <td className="px-6 py-4">
                      <img 
                        src={fp.imageUrl} 
                        alt={fp.name}
                        className="h-16 w-auto rounded border border-gray-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="50"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E🗺️%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{fp.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{fp.building || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{fp.floor || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {fp._count.rooms} rooms
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        fp.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {fp.active ? '✅ Actief' : '⏸️ Inactief'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(fp)}
                          className="bg-blue-500/60 hover:bg-blue-600/70 backdrop-blur-md border border-blue-400/30 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          ✏️ Bewerken
                        </button>
                        <button
                          onClick={() => deleteFloorPlan(fp.id)}
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

