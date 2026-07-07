import React from 'react';
import { Star, MapPin, Heart } from 'lucide-react';
import { Salon } from '../types';

interface SalonCardProps {
  key?: string;
  salon: Salon;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e?: any) => void;
  onSelect: (id: string) => void;
}

export default function SalonCard({ salon, isFavorite, onToggleFavorite, onSelect }: SalonCardProps) {
  return (
    <div
      id={`salon-card-${salon.id}`}
      onClick={() => onSelect(salon.id)}
      className="group bg-white rounded-2xl p-3 border border-transparent hover:border-brand-border/60 overflow-hidden transition-all duration-300 cursor-pointer flex flex-col h-full hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Salon Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-secondary rounded-xl mb-3 border border-black/5">
        <img
          src={salon.image}
          alt={salon.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Deal/Featured Badge */}
        {salon.rating && salon.rating > 4.8 ? (
          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-[10px] font-bold text-brand-text px-2.5 py-1 rounded-full shadow-xs border border-brand-border">
            {salon.rating === 5.0 ? 'Featured' : 'Deals'}
          </span>
        ) : null}
        
        {/* Favorite Button */}
        <button
          id={`favorite-btn-${salon.id}`}
          onClick={(e) => onToggleFavorite(salon.id, e)}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all shadow-xs cursor-pointer border border-white/20 group/fav"
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-200 ${
              isFavorite ? 'fill-white text-white' : 'text-white group-hover/fav:text-white'
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-1 mt-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-sans font-bold text-[15px] text-brand-text leading-tight group-hover:underline">
            {salon.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-[13px] font-bold text-brand-text">
              {(salon.rating || 0).toFixed(1)} <span className="font-normal text-brand-muted">({salon.reviewCount || 0})</span>
            </span>
          </div>
        </div>
        
        <p className="text-[13px] text-brand-text/60 mt-1 font-medium">
          {salon.distance} km • {salon.neighborhood}
        </p>
        <p className="text-[13px] text-brand-text/60 mt-0.5 font-medium">
          {salon.type}
        </p>
      </div>
    </div>
  );
}
