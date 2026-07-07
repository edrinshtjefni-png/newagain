import React, { useState, useRef, useEffect } from 'react';
import { Search, Scissors, Sparkles, Eye, Navigation, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SERVICE_CATEGORIES } from '../data';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroSearchProps {
  onSearch: (query: string, category?: string, openMap?: boolean) => void;
  initialQuery?: string;
  onActivateLocation?: () => void;
}

export default function HeroSearch({ onSearch, initialQuery = '', onActivateLocation }: HeroSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, '', true);
    setIsFocused(false);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 px-4 md:px-8">
      {/* Centered Search Bar */}
      <div className="w-full max-w-2xl relative z-30 scale-[1.44] transform origin-center transition-transform mb-24" ref={containerRef}>
        <div className="p-2 bg-emerald-100/50 border border-emerald-200/60 rounded-full shadow-xs transition-all duration-300 hover:bg-emerald-100/70">
          <form 
            id="search-form"
            onSubmit={handleSearchSubmit}
            className={`flex items-center bg-white border rounded-full transition-all duration-300 ${
              isFocused 
                ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-[1.01]' 
                : 'border-brand-border shadow-xs hover:border-emerald-300'
            }`}
          >
            <div className="pl-5 text-brand-muted">
              <Search className="w-5 h-5 text-emerald-600/80" />
            </div>
            
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={t('hero.search')}
              className="w-full py-4 px-4 text-sm font-semibold text-brand-text bg-transparent outline-none placeholder-brand-muted"
            />
            
            {onActivateLocation && (
              <button
                id="search-location-activate"
                type="button"
                onClick={onActivateLocation}
                className="p-2.5 mx-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0"
                title="Finn nærmeste salong med GPS / Use GPS location to find closest salon"
              >
                <Navigation className="w-4 h-4 fill-emerald-600/20" />
              </button>
            )}

            <button
              id="search-button"
              type="submit"
              className="mr-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full transition-colors cursor-pointer tracking-wider uppercase"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
