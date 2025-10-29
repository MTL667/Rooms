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
        className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold px-3 py-1.5 rounded-lg transition-all text-sm whitespace-nowrap flex items-center justify-center gap-1.5"
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span className="uppercase font-bold text-xs">{currentLanguage.code}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-gradient-to-br from-teal-900/95 to-cyan-900/95 backdrop-blur-md border-2 border-teal-400/40 rounded-lg shadow-2xl p-1.5 min-w-[140px] z-[9999]">
          <div className="flex flex-col gap-0.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all text-left ${
                  language === lang.code
                    ? 'bg-gradient-to-r from-teal-400/80 to-cyan-400/80 border border-white/40'
                    : 'bg-white/10 border border-white/20 hover:bg-white/20'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold uppercase ${
                    language === lang.code ? 'text-white' : 'text-teal-300'
                  }`}>
                    {lang.code}
                  </span>
                  <span className={`text-[9px] ${
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
