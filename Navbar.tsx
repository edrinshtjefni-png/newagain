import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Apple, Zap, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface NavbarProps {
  user: UserProfile | null;
  onNavigate: (view: 'home' | 'bookings' | 'favorites' | 'profile' | 'business' | 'admin') => void;
  currentView: string;
  onOpenAuth: () => void;
  onLogout: () => void;
}

const LANGUAGES = [
  { code: 'no', flag: '🇳🇴', name: 'Norsk' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'se', flag: '🇸🇪', name: 'Svenska' },
  { code: 'fi', flag: '🇫🇮', name: 'Suomi' },
  { code: 'dk', flag: '🇩🇰', name: 'Dansk' },
  { code: 'pl', flag: '🇵🇱', name: 'Polski' },
] as const;

export default function Navbar({ user, onNavigate, currentView, onOpenAuth, onLogout }: NavbarProps) {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const selectedLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full h-[calc(4rem+5vh)] pt-[5vh] bg-instagram-gradient z-50 px-4 md:px-[10%] flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <button 
          id="nav-logo"
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-1.5 cursor-pointer"
        >
          <Zap className="text-yellow-400 rotate-[15deg]" size={24} fill="currentColor" strokeWidth={1} />
          <span className="font-sans font-black tracking-tighter text-brand-text text-2xl flex items-center">
            StraksTime<span className="text-brand-muted font-bold text-xl ml-[1px] opacity-80">.no</span>
          </span>
        </button>

        {/* Language Selector */}
        <div className="relative" ref={langRef}>
          <button 
            id="btn-lang-selector"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/40 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-xl leading-none">{selectedLang.flag}</span>
            <ChevronDown size={14} className="text-brand-muted" />
          </button>
          
          {isLangOpen && (
            <div className="absolute top-full mt-2 left-0 bg-white border border-brand-border rounded-xl shadow-xl py-1 z-50 min-w-[120px]">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as any);
                    setIsLangOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-brand-secondary transition-colors ${
                    selectedLang.code === lang.code ? 'bg-brand-secondary text-brand-primary' : 'text-brand-text'
                  }`}
                >
                  <span className="text-lg leading-none">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile & Navigation */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            {user.role === 'admin' ? (
              <button
                id="btn-nav-admin"
                onClick={() => onNavigate('admin')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs border ${
                  currentView === 'admin'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white hover:bg-red-50 text-red-600 border-red-200'
                }`}
              >
                Admin
              </button>
            ) : user.role === 'business' ? (
              <button
                id="btn-nav-business"
                onClick={() => onNavigate('business')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs border ${
                  currentView === 'business'
                    ? 'bg-brand-dark text-white border-brand-dark'
                    : 'bg-brand-primary hover:bg-brand-dark text-white border-brand-primary'
                }`}
              >
                {t('nav.partner')}
              </button>
            ) : (
              <>
                <button
                  id="btn-nav-bookings"
                  onClick={() => onNavigate('bookings')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'bookings'
                      ? 'bg-brand-primary text-white'
                      : 'text-brand-text hover:bg-brand-secondary'
                  }`}
                >
                  My Bookings
                </button>
                <button
                  id="btn-nav-favorites"
                  onClick={() => onNavigate('favorites')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    currentView === 'favorites'
                      ? 'bg-brand-primary text-white'
                      : 'text-brand-text hover:bg-brand-secondary'
                  }`}
                >
                  Favorites
                </button>
              </>
            )}
            
            {/* User profile details and logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-brand-border">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-brand-border shrink-0"
              />
              <div className="hidden md:block text-left">
                <p className="text-[10px] font-black text-brand-text leading-tight">{user.name}</p>
                <p className="text-[8px] font-bold text-brand-muted capitalize leading-none">{user.role || 'customer'}</p>
              </div>
              <div id="navbar-settings-portal-target" className="ml-1 flex items-center"></div>
              <button
                id="btn-nav-logout"
                onClick={onLogout}
                className="ml-2 px-3 py-1.5 border border-brand-border hover:border-brand-muted text-[10px] font-black rounded-lg text-brand-muted hover:text-brand-text uppercase cursor-pointer transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              id="btn-nav-signin"
              onClick={onOpenAuth}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl hover:shadow-xs transition-all uppercase tracking-wider cursor-pointer"
            >
              {t('nav.signin')}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
