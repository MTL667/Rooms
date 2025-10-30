'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function BrandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.email) {
      loadSettings();
    }
  }, [session]);

  const loadSettings = async () => {
    if (!session?.user?.email) return;
    
    try {
      const res = await fetch(`/api/admin/settings?userEmail=${encodeURIComponent(session.user.email)}`);
      const data = await res.json();
      setLogoUrl(data.logo_url || '');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      const { url } = await uploadRes.json();

      // Save logo URL to settings
      const settingsRes = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: 'logo_url', 
          value: url,
          userEmail: session?.user?.email 
        }),
      });

      if (!settingsRes.ok) {
        throw new Error('Failed to save logo URL');
      }

      setLogoUrl(url);
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload logo' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) return;

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: 'logo_url', 
          value: '',
          userEmail: session?.user?.email 
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to remove logo');
      }

      setLogoUrl('');
      setMessage({ type: 'success', text: 'Logo removed successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to remove logo' });
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-gray-900 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <main className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 text-white py-4 px-6 rounded-lg mb-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">🎨 Branding Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Logo Upload Card */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-xl p-8 border-2 border-teal-200">
          <h2 className="text-2xl font-bold text-teal-900 mb-6">Custom Logo</h2>

          {/* Current Logo Preview */}
          {logoUrl && (
            <div className="mb-6 p-6 bg-white rounded-lg border-2 border-teal-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Current Logo:</p>
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                <img
                  src={logoUrl}
                  alt="Current Logo"
                  className="max-h-24 object-contain"
                />
              </div>
              <button
                onClick={handleRemoveLogo}
                className="mt-4 w-full bg-red-500/60 hover:bg-red-500/80 backdrop-blur-md border border-red-400/40 text-white font-semibold px-4 py-2 rounded-lg transition-all"
              >
                🗑️ Remove Logo
              </button>
            </div>
          )}

          {/* Upload Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Upload New Logo
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Recommended: PNG with transparent background, max 2MB, aspect ratio 2:1 or 3:1
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full px-4 py-2 border-2 border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
              />
            </div>

            {uploading && (
              <div className="flex items-center gap-3 text-teal-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                <span className="font-semibold">Uploading...</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>💡 Tip:</strong> Your logo will appear in the header of all pages, replacing the building icon.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

