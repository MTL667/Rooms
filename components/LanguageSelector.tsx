'use client';

import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'nl', label: t('dutch'), flag: '🇳🇱' },
    { code: 'fr', label: t('french'), flag: '🇫🇷' },
    { code: 'en', label: t('english'), flag: '🇬🇧' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 min-w-[100px] whitespace-nowrap flex items-center justify-center gap-2"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="uppercase font-bold">{currentLanguage.code}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-gradient-to-br from-teal-900/95 to-cyan-900/95 backdrop-blur-md border-2 border-teal-400/40 rounded-xl shadow-2xl p-2 min-w-[160px] z-[9999]">
          <div className="flex flex-col gap-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left ${
                  language === lang.code
                    ? 'bg-gradient-to-r from-teal-400/80 to-cyan-400/80 border-2 border-white/40 shadow-lg'
                    : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:scale-105'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold uppercase ${
                    language === lang.code ? 'text-white' : 'text-teal-300'
                  }`}>
                    {lang.code}
                  </span>
                  <span className={`text-[10px] ${
                    language === lang.code ? 'text-white/80' : 'text-teal-400/70'
                  }`}>
                    {lang.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
