import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 mt-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Room Booking System
          </h1>
          <p className="text-xl text-gray-600">
            Book meeting rooms and sync with Microsoft 365
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link 
            href="/rooms"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-2xl font-semibold text-blue-600 mb-2">
              📅 Find & Book
            </div>
            <p className="text-gray-600">
              Browse available rooms and reserve a meeting space.
            </p>
          </Link>

          <Link 
            href="/my-bookings"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-2xl font-semibold text-green-600 mb-2">
              ✅ My Bookings
            </div>
            <p className="text-gray-600">
              View and manage your room reservations.
            </p>
          </Link>

          <Link 
            href="/admin"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-2xl font-semibold text-purple-600 mb-2">
              ⚙️ Admin Panel
            </div>
            <p className="text-gray-600">
              Manage rooms, users, and settings.
            </p>
          </Link>

          <Link 
            href="/auth/signin"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-2xl font-semibold text-orange-600 mb-2">
              🔐 Sign In
            </div>
            <p className="text-gray-600">
              Microsoft or email authentication.
            </p>
          </Link>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a minimal MVP. Full UI features coming soon. 
            Use the API endpoints to interact with rooms and bookings.
          </p>
        </div>
      </div>
    </main>
  );
}
