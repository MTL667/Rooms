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
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-gradient-to-br from-teal-900/90 to-cyan-900/90 backdrop-blur-md border-2 border-teal-400/40 rounded-xl shadow-2xl p-3">
        <div className="text-teal-200 text-xs font-semibold mb-2 text-center">
          {t('language')}
        </div>
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                language === lang.code
                  ? 'bg-gradient-to-r from-teal-400/80 to-cyan-400/80 border-2 border-white/40 shadow-lg scale-110'
                  : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:scale-105'
              }`}
              title={lang.label}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className={`text-[10px] font-bold uppercase ${
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

