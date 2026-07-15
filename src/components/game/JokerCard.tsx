// src/components/game/JokerCard.tsx
"use client";

import { useState } from "react";
import type { Joker } from "@/lib/game/types";

interface JokerCardProps {
  joker: Joker;
  price: number;
  affordable: boolean;
  onBuy: () => void;
  characterId?: string | null;
}

export function JokerCard({ 
  joker, 
  price, 
  affordable, 
  onBuy,
  characterId 
}: JokerCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "ring-blue-400/30";
      case "rare": return "ring-purple-400/30";
      case "elite": return "ring-amber-400/30";
      case "legendary": return "ring-red-400/30";
      default: return "ring-white/10";
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-blue-500 text-white";
      case "rare": return "bg-purple-500 text-white";
      case "elite": return "bg-amber-500 text-black";
      case "legendary": return "bg-red-500 text-white";
      default: return "bg-zinc-500 text-white";
    }
  };

  const rarityColor = getRarityColor(joker.rarity);
  const rarityBadgeColor = getRarityBadgeColor(joker.rarity);
  const imageSrc = imageError ? '/joker1.jpg' : joker.icon;

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        relative aspect-[2/3] w-full overflow-hidden rounded-lg 
        bg-gradient-to-b from-zinc-800 to-zinc-900 
        ring-2 transition-all duration-300
        ${rarityColor}
        hover:scale-105 hover:ring-amber-400/50
        ${affordable ? 'hover:shadow-lg' : 'opacity-70'}
      `}>
        <img
          src={imageSrc}
          alt={joker.nameTr || joker.name}
          className="h-full w-full object-cover"
          onError={() => {
            console.error(`Görsel yüklenemedi: ${joker.icon}`);
            setImageError(true);
          }}
        />
        
        {/* Rarity Badge */}
        <div className="absolute top-1 right-1">
          <span className={`
            text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
            ${rarityBadgeColor}
          `}>
            {joker.rarity}
          </span>
        </div>

        {/* Hover Overlay - Bonus Bilgisi */}
        <div className={`
          absolute inset-0 flex items-center justify-center 
          bg-black/85 transition-opacity duration-300 p-3
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-amber-200">
              {joker.nameTr || joker.name}
            </p>
            <p className="text-[10px] text-zinc-300 leading-relaxed">
              {joker.description}
            </p>
            {joker.flavor && (
              <p className="text-[8px] italic text-zinc-400 mt-1">
                "{joker.flavor}"
              </p>
            )}
            <p className="text-[10px] font-bold text-amber-200 mt-2">
              🪙 {price}
            </p>
          </div>
        </div>

        {/* Satın Alma Butonu */}
        <button
          onClick={onBuy}
          disabled={!affordable}
          className={`
            absolute bottom-2 left-1/2 -translate-x-1/2 
            px-3 py-1.5 rounded-md text-xs font-bold
            transition-all duration-200 whitespace-nowrap
            ${affordable 
              ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400 hover:scale-105' 
              : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'}
          `}
        >
          {affordable ? `🪙 ${price} Satın Al` : `🪙 ${price}`}
        </button>
      </div>
    </div>
  );
}

// JokerRow Bileşeni - Tooltip ile
interface JokerRowProps {
  jokers: Joker[];
  className?: string;
}

export function JokerRow({ jokers, className }: JokerRowProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  if (jokers.length === 0) {
    return (
      <div className={className || "text-sm text-zinc-500 italic"}>
        Henüz jokerin yok. Dükkândan satın al!
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className || ""}`}>
      {jokers.map((joker) => {
        const hasError = imageErrors[joker.id];
        const imageSrc = hasError ? '/joker1.jpg' : joker.icon;
        
        return (
          <div
            key={joker.id}
            className="relative group"
          >
            {/* Joker Mini Kart */}
            <div className="relative w-10 h-14 rounded overflow-hidden ring-1 ring-white/10 hover:ring-amber-400/50 transition-all duration-200 hover:scale-110 cursor-help">
              <img
                src={imageSrc}
                alt={joker.nameTr || joker.name}
                className="w-full h-full object-cover"
                onError={() => {
                  setImageErrors(prev => ({ ...prev, [joker.id]: true }));
                }}
              />
              
              {/* Rarity göstergesi - küçük nokta */}
              <div className={`
                absolute top-0.5 right-0.5 w-2 h-2 rounded-full
                ${joker.rarity === 'legendary' ? 'bg-red-400' :
                  joker.rarity === 'elite' ? 'bg-amber-400' :
                  joker.rarity === 'rare' ? 'bg-purple-400' :
                  'bg-blue-400'}
              `} />
            </div>

            {/* Tooltip - Hover'da açıklama göster */}
            <div className="
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
              opacity-0 group-hover:opacity-100 
              transition-all duration-200 pointer-events-none
              z-50 w-56
            ">
              <div className="
                bg-zinc-900/95 backdrop-blur-sm 
                border border-amber-400/30 rounded-xl 
                p-3 shadow-2xl shadow-black/50
              ">
                {/* Başlık */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-amber-200">
                    {joker.nameTr || joker.name}
                  </span>
                  <span className={`
                    text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                    ${joker.rarity === 'legendary' ? 'bg-red-500 text-white' :
                      joker.rarity === 'elite' ? 'bg-amber-500 text-black' :
                      joker.rarity === 'rare' ? 'bg-purple-500 text-white' :
                      'bg-blue-500 text-white'}
                  `}>
                    {joker.rarity}
                  </span>
                </div>
                
                {/* Açıklama */}
                <p className="text-[10px] text-zinc-300 leading-relaxed">
                  {joker.description}
                </p>
                
                {/* Flavor text */}
                {joker.flavor && (
                  <p className="text-[8px] italic text-zinc-400 mt-1">
                    "{joker.flavor}"
                  </p>
                )}
                
                {/* Ok işareti */}
                <div className="
                  absolute -bottom-1.5 left-1/2 -translate-x-1/2
                  w-3 h-3 bg-zinc-900/95 rotate-45
                  border-r border-b border-amber-400/30
                " />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}