import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, useT } from '@/lib/translations';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'company';
  country: string;
  company_name?: string;
  crop_needed?: string;
  volume?: number;
}

interface ParcelResult {
  id: string;
  name: string;
  area: number;
  lat: number;
  lon: number;
  soilData: any;
  weatherData: any;
  forecastData: any;
  cropAnalysis?: any;
  createdAt: string;
}

interface AppState {
  user: User | null;
  lang: Lang;
  parcels: ParcelResult[];
  setLang: (l: Lang) => void;
  login: (user: User) => void;
  logout: () => void;
  addParcel: (p: ParcelResult) => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('agri_lang');
    return (saved === 'en' || saved === 'fr') ? saved : 'fr';
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('agri_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [parcels, setParcels] = useState<ParcelResult[]>(() => {
    const saved = localStorage.getItem('agri_parcels');
    return saved ? JSON.parse(saved) : [];
  });

  const t = useT(lang);

  useEffect(() => { localStorage.setItem('agri_lang', lang); }, [lang]);
  useEffect(() => {
    if (user) localStorage.setItem('agri_user', JSON.stringify(user));
    else localStorage.removeItem('agri_user');
  }, [user]);
  useEffect(() => { localStorage.setItem('agri_parcels', JSON.stringify(parcels)); }, [parcels]);

  const login = (u: User) => setUser(u);
  const logout = () => { setUser(null); localStorage.removeItem('agri_user'); };
  const addParcel = (p: ParcelResult) => setParcels(prev => [...prev, p]);

  return (
    <AppContext.Provider value={{ user, lang, parcels, setLang, login, logout, addParcel, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
