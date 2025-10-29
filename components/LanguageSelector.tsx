'use client';

import { useLanguage, Language } from '@/contexts/LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'nl', label: t('dutch'), flag: '🇳🇱' },
    { code: 'fr', label: t('french'), flag: '🇫🇷' },
    { code: 'en', label: t('english'), flag: '🇬🇧' },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-gradient-to-br from-teal-900/95 to-cyan-900/95 backdrop-blur-md border-2 border-teal-400/40 rounded-xl shadow-2xl p-2">
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all ${
                language === lang.code
                  ? 'bg-gradient-to-r from-teal-400/80 to-cyan-400/80 border-2 border-white/40 shadow-lg'
                  : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:scale-105'
              }`}
              title={lang.label}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className={`text-[9px] font-bold uppercase ${
                language === lang.code ? 'text-white' : 'text-teal-300'
              }`}>
                {lang.code}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

