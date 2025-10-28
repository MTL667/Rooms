export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">Tenants Management</h2>
            <p className="text-gray-600 mb-4">
              Manage allowed Azure AD tenants for Microsoft authentication.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>Add/Remove allowed tenants</li>
              <li>View active tenant connections</li>
              <li>Monitor tenant usage</li>
            </ul>
            <p className="mt-4 text-sm text-gray-500">
              API: <code className="bg-gray-100 px-2 py-1 rounded">GET/POST /api/admin/tenants</code>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">User Management</h2>
            <p className="text-gray-600 mb-4">
              Create and manage manual users for external access.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>Invite external users</li>
              <li>Set user roles and permissions</li>
              <li>View user activity</li>
              <li>Manage 2FA enrollment</li>
            </ul>
            <p className="mt-4 text-sm text-gray-500">
              API: <code className="bg-gray-100 px-2 py-1 rounded">GET/POST /api/admin/users</code>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-600">Rooms Management</h2>
            <p className="text-gray-600 mb-4">
              Configure available meeting rooms and their settings.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>Add/Edit room details</li>
              <li>Set capacity and location</li>
              <li>Link to Microsoft resource mailboxes</li>
              <li>Configure pricing for external rentals</li>
            </ul>
            <p className="mt-4 text-sm text-gray-500">
              API: <code className="bg-gray-100 px-2 py-1 rounded">GET/POST /api/admin/rooms</code>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-600">System Settings</h2>
            <p className="text-gray-600 mb-4">
              Configure global settings and integrations.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>Microsoft Graph configuration</li>
              <li>Email template settings</li>
              <li>Privacy and masking rules</li>
              <li>System logs and audit trail</li>
            </ul>
            <p className="mt-4 text-sm text-gray-500">
              API: <code className="bg-gray-100 px-2 py-1 rounded">GET/POST /api/admin/settings</code>
            </p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Development Note:</strong> These admin features will be implemented with full CRUD interfaces. 
            Use the API endpoints for now or Prisma Studio for quick management.
          </p>
        </div>
      </div>
    </main>
  );
}
