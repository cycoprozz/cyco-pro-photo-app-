import React from 'react';
import { HeadshotStyle, BackgroundOption } from '../types';
import { Briefcase, Terminal, LandPlot, MonitorDot, Star, MapPin, Sword, Crown, Plane, Ghost, Package, Box, Palette, Camera } from 'lucide-react';

export const STYLES: HeadshotStyle[] = [
  {
    id: 'corporate',
    name: 'Corporate/Pro',
    description: 'Clean, professional, trustworthy.',
    promptModifier: 'Professional corporate photography, clean lighting, trustworthy atmosphere, sharp focus, neutral tones',
    previewColor: 'bg-stone-700'
  },
  {
    id: 'product',
    name: 'Product Studio',
    description: 'Commercial advertising standard.',
    promptModifier: 'High-end commercial product photography, softbox lighting, 4k resolution, clean composition, advertising standard, detailed textures',
    previewColor: 'bg-white text-black'
  },
  {
    id: 'cyber',
    name: 'CyCo Netrunner',
    description: 'Futuristic cyberpunk aesthetics.',
    promptModifier: 'Cyberpunk style, neon rim lighting, high-tech vibe, circuit patterns, dark moody atmosphere with blue and pink glowing accents',
    previewColor: 'bg-[#ea580c]'
  },
  {
    id: 'render',
    name: '3D Isometric',
    description: 'Cute 3D blender render style.',
    promptModifier: '3D isometric render style, cute aesthetics, soft clay-like textures, bright studio lighting, blender 3d style, clean shapes',
    previewColor: 'bg-blue-500'
  },
  {
    id: 'painting',
    name: 'Oil Painting',
    description: 'Classic textured art.',
    promptModifier: 'Classical oil painting, thick brushstrokes, textured canvas look, artistic lighting, fine art masterpiece',
    previewColor: 'bg-yellow-900'
  },
  {
    id: 'samurai',
    name: 'Cyber Samurai',
    description: 'Tech-armor meets tradition.',
    promptModifier: 'Futuristic urban samurai, sleek tactical armor plates, glowing accents, intense disciplined expression, rain-slicked lighting',
    previewColor: 'bg-red-900'
  },
  {
    id: 'dune',
    name: 'Desert Walker',
    description: 'Nomadic, desert survival gear style.',
    promptModifier: 'Sci-fi desert nomad style, wearing stillsuit-inspired armor textures, scarf, weathered texture, intense gaze, cinematic warm lighting',
    previewColor: 'bg-[#d97706]'
  },
  {
    id: 'editorial',
    name: 'High Fashion',
    description: 'Vogue style, dramatic contrast.',
    promptModifier: 'High-fashion editorial portrait, avant-garde styling, dramatic shadows, bold artistic lighting, sharp details',
    previewColor: 'bg-stone-800'
  },
  {
    id: 'ethereal',
    name: 'Ethereal',
    description: 'Soft, dreamy, light and airy.',
    promptModifier: 'Ethereal aesthetic, soft focus, pastel colors, flowing light fabrics, angelic lighting, dreamy atmosphere',
    previewColor: 'bg-teal-900'
  },
  {
    id: 'bw',
    name: 'Noir Chrome',
    description: 'Black & white with metallic sheen.',
    promptModifier: 'Black and white metallic photography, high contrast, chrome skin texture hints, dramatic noir lighting',
    previewColor: 'bg-black'
  }
];

export const BACKGROUNDS: BackgroundOption[] = [
  {
    id: 'studio_clean',
    name: 'Studio Clean',
    promptModifier: 'Solid neutral clean studio background, infinite white or soft grey'
  },
  {
    id: 'arrakis',
    name: 'Deep Desert',
    promptModifier: 'Vast sand dunes at sunset, spice dust in the air, warm orange atmosphere, alien planet horizon'
  },
  {
    id: 'office',
    name: 'Modern Office',
    promptModifier: 'Blurred modern glass office building, bokeh lights, city skyline in distance'
  },
  {
    id: 'cyber_city',
    name: 'Neon City',
    promptModifier: 'Out of focus cyberpunk city street at night, neon signs reflecting in rain, blue and pink bokeh'
  },
  {
    id: 'nature',
    name: 'Deep Nature',
    promptModifier: 'Lush green forest, natural sunlight filtering through leaves, organic environment'
  },
  {
    id: 'luxury',
    name: 'Luxury Interior',
    promptModifier: 'High-end luxury interior, marble textures, gold accents, warm ambient lighting'
  }
];

interface SelectorProps<T> {
  options: T[];
  selectedId: string | null;
  onSelect: (item: T) => void;
  renderIcon: (id: string) => React.ReactNode;
}

export function Selector<T extends { id: string; name: string; description?: string; previewColor?: string }>({ 
  options, 
  selectedId, 
  onSelect, 
  renderIcon 
}: SelectorProps<T>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option)}
          className={`
            relative overflow-hidden group text-left
            p-5 rounded-lg border transition-all duration-300
            ${selectedId === option.id 
              ? 'border-[#ea580c] bg-[#ea580c]/10 shadow-[0_0_15px_rgba(234,88,12,0.3)]' 
              : 'border-[#44403c] bg-[#1c1917] hover:border-[#a8a29e]'
            }
          `}
        >
          <div className="flex items-center gap-3 mb-2">
             <div className={`${selectedId === option.id ? 'text-[#ea580c]' : 'text-[#a8a29e]'}`}>
               {renderIcon(option.id)}
             </div>
             <h3 className={`font-orbitron font-bold text-sm tracking-wide ${selectedId === option.id ? 'text-[#ea580c]' : 'text-stone-200'}`}>
               {option.name}
             </h3>
          </div>
          
          {option.description && (
            <p className="text-stone-500 text-xs leading-relaxed">
              {option.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

export const getIconForStyle = (id: string) => {
  switch (id) {
    case 'corporate': return <Briefcase size={20} />;
    case 'cyber': return <Terminal size={20} />;
    case 'samurai': return <Sword size={20} />;
    case 'dune': return <LandPlot size={20} />;
    case 'product': return <Package size={20} />;
    case 'render': return <Box size={20} />;
    case 'painting': return <Palette size={20} />;
    case 'editorial': return <Star size={20} />;
    case 'ethereal': return <Ghost size={20} />;
    case 'bw': return <Camera size={20} />;
    default: return <Briefcase size={20} />;
  }
};

export const getIconForBackground = (id: string) => {
   return <MapPin size={20} />;
};
