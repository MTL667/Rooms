'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Language, translations, TranslationKey } from '@/lib/i18n/translations';

// Re-export Language type for components
export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [language, setLanguageState] = useState<Language>('nl');
  const [isInitialized, setIsInitialized] = useState(false);

  // Detect browser language
  const getBrowserLanguage = (): Language => {
    if (typeof window === 'undefined') return 'nl';
    
    const browserLang = navigator.language.toLowerCase();
    
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('en')) return 'en';
    return 'nl'; // Default to Dutch
  };

  // Initialize language from user preference or browser
  useEffect(() => {
    if (!isInitialized) {
      const savedLang = localStorage.getItem('language') as Language | null;
      const initialLang = savedLang || getBrowserLanguage();
      setLanguageState(initialLang);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Fetch user's language preference from database
  useEffect(() => {
    if (session?.user?.email && isInitialized) {
      fetch(`/api/user/language?email=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.language) {
            setLanguageState(data.language as Language);
            localStorage.setItem('language', data.language);
          }
        })
        .catch(err => console.error('Failed to fetch user language:', err));
    }
  }, [session?.user?.email, isInitialized]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);

    // Save to database if user is logged in
    if (session?.user?.email) {
      try {
        await fetch('/api/user/language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.user.email,
            language: lang,
          }),
        });
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

