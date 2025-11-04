'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PendingContent() {
  const searchParams = useSearchParams();
  const tenantName = searchParams.get('tenant') || 'Uw organisatie';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full border-2 border-teal-200">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-full p-6 shadow-lg">
              <svg 
                className="w-16 h-16 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Aanvraag in Behandeling
          </h1>

          {/* Message */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
            <p className="text-lg text-gray-800 mb-3">
              Uw organisatie <span className="font-bold text-teal-600">{tenantName}</span> heeft toegang aangevraagd tot Rooms.
            </p>
            <p className="text-gray-700">
              Een beheerder moet deze aanvraag goedkeuren voordat u kunt inloggen.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-6 mb-8">
            <h2 className="font-bold text-lg text-gray-900 mb-3 flex items-center justify-center gap-2">
              <span>ℹ️</span> Wat gebeurt er nu?
            </h2>
            <ul className="text-left text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 font-bold mt-1">1.</span>
                <span>Uw aanvraag is automatisch geregistreerd</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 font-bold mt-1">2.</span>
                <span>Een beheerder ontvangt een notificatie</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 font-bold mt-1">3.</span>
                <span>Na goedkeuring kunt u inloggen en Rooms gebruiken</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.close()}
              className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-bold px-8 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              Sluiten
            </button>
            <a
              href="/"
              className="bg-white border-2 border-teal-400 text-teal-600 hover:bg-teal-50 font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-block"
            >
              Terug naar Home
            </a>
          </div>

          {/* Contact Info */}
          <p className="text-sm text-gray-600 mt-8">
            Neem bij vragen contact op met uw systeembeheerder
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}

