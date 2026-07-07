import React from 'react';
import { Stylist } from '../types';
import { X, Star, Briefcase, Award, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface StylistProfileModalProps {
  stylist: Stylist;
  onClose: () => void;
}

export default function StylistProfileModal({ stylist, onClose }: StylistProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-bg border border-brand-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8"
      >
        {/* Header & Cover */}
        <div className="relative h-48 bg-brand-secondary">
          {stylist.portfolio && stylist.portfolio.length > 0 ? (
            <img src={stylist.portfolio[0]} alt="Cover" className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full bg-brand-secondary"></div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 md:px-8 pb-8">
          <div className="flex flex-col md:flex-row gap-6 -mt-12 relative z-10 mb-8">
            <img 
              src={stylist.image} 
              alt={stylist.name} 
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-brand-bg shadow-lg bg-white shrink-0"
            />
            <div className="pt-2 md:pt-14">
              <h2 className="text-2xl font-serif font-black text-brand-text leading-tight">{stylist.name}</h2>
              <p className="text-sm font-bold text-brand-primary mb-2">{stylist.role}</p>
              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 inline-flex">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="text-xs font-black text-amber-700">{stylist.rating}</span>
                {stylist.testimonials && <span className="text-[10px] font-bold text-amber-600/70 ml-1">({stylist.testimonials.length} reviews)</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="md:col-span-1 space-y-6">
              {stylist.expertise && stylist.expertise.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black text-brand-text mb-3 uppercase tracking-wider">
                    <Award className="w-4 h-4 text-brand-primary" />
                    Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {stylist.expertise.map((exp, idx) => (
                      <span key={idx} className="bg-white border border-brand-border text-brand-text px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="flex items-center gap-2 text-sm font-black text-brand-text mb-3 uppercase tracking-wider">
                  <Briefcase className="w-4 h-4 text-brand-primary" />
                  Bio
                </h3>
                <p className="text-xs text-brand-muted font-medium leading-relaxed">
                  With years of experience, {stylist.name} brings a creative and meticulous approach to {stylist.role.toLowerCase()}. Dedicated to making every client feel confident and refreshed.
                </p>
              </div>
            </div>

            {/* Right Column: Portfolio & Testimonials */}
            <div className="md:col-span-2 space-y-8">
              {stylist.portfolio && stylist.portfolio.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-brand-text mb-4 uppercase tracking-wider">Portfolio</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {stylist.portfolio.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-brand-border shadow-xs">
                        <img src={img} alt="Portfolio item" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stylist.testimonials && stylist.testimonials.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black text-brand-text mb-4 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-brand-primary" />
                    Client Love
                  </h3>
                  <div className="space-y-4">
                    {stylist.testimonials.map((test) => (
                      <div key={test.id} className="bg-brand-secondary p-4 rounded-2xl border border-brand-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-brand-text">{test.clientName}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < test.rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-brand-muted italic leading-relaxed">"{test.comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
