import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

const PRESETS = [
  { id: 'liquid', label: 'Battery (Liquid)' },
  { id: 'wireframe', label: 'Ambience (Tunnel)' },
  { id: 'nebula', label: 'Nebula (Particle Swarm)' },
  { id: 'synthwave', label: 'Synthwave (Retro Grid)' },
  { id: 'kaleidoscope', label: 'Kaleidoscope (Fractal)' },
  { id: 'synapse', label: 'Synapse (Neural Network)' },
  { id: 'cymatics', label: 'Cymatics (Resonant Sand)' },
  { id: 'singularity', label: 'Singularity (Black Hole)' },
  { id: 'prism', label: 'Prism (Voronoi Glass)' },
  { id: 'aurora', label: 'Aurora (Light Ribbons)' }
];

const CURATED_COLORS = [
  '#a855f7', '#00aaff', '#ff00aa', '#ffaa00', '#aa00ff', '#ff0044', '#00ffcc', '#ffcc00'
];

export const UI = () => {
  const { 
    preset, setPreset, 
    color, setColor, 
    autoMode, setAutoMode, 
    autoColor, setAutoColor 
  } = useAppStore();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timeout;
    const handleActivity = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 3000);
    };

    window.addEventListener('pointermove', handleActivity);
    window.addEventListener('pointerdown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    // Initial timeout
    timeout = setTimeout(() => setIsVisible(false), 3000);

    return () => {
      window.removeEventListener('pointermove', handleActivity);
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(timeout);
    };
  }, []);

  // Auto Mode Effect
  useEffect(() => {
    if (!autoMode) return;
    const interval = setInterval(() => {
      setPreset(prev => {
        const available = PRESETS.filter(p => p.id !== prev);
        const randomPreset = available[Math.floor(Math.random() * available.length)];
        return randomPreset.id;
      });
    }, 7000); // 7 seconds
    return () => clearInterval(interval);
  }, [autoMode, setPreset]);

  // Auto Color Effect
  useEffect(() => {
    if (!autoColor) return;
    const interval = setInterval(() => {
      const randomColor = CURATED_COLORS[Math.floor(Math.random() * CURATED_COLORS.length)];
      setColor(randomColor);
    }, 7000); // 7 seconds
    return () => clearInterval(interval);
  }, [autoColor, setColor]);

  return (
    <div 
      className={`fixed top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ zIndex: 10 }}
    >
      <div className={`absolute bottom-4 left-4 right-4 md:bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2 flex flex-col md:flex-row justify-center items-center gap-4 sm:gap-6 bg-black/40 backdrop-blur-2xl p-4 sm:p-5 rounded-[2rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] w-auto max-w-full touch-manipulation transition-all duration-1000 ease-in-out ${isVisible ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
        
        {/* Brand Watermark */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <span 
            className="text-xl font-black tracking-tighter select-none transition-colors duration-500"
            style={{ 
              color: color,
              textShadow: `0 0 15px ${color}66`
            }}
          >
            VYBE
          </span>
          <div className="hidden md:block w-px h-10 bg-white/10"></div>
        </div>

        {/* Top Row: Design and Color */}
        <div className="flex flex-row items-center justify-between w-full md:w-auto gap-4 md:gap-6">
          
          {/* Preset Selector */}
          <div className="flex flex-col items-start gap-2 md:gap-3 flex-1 md:flex-initial">
            <span className="text-[10px] sm:text-xs text-white/50 font-bold tracking-[0.2em] uppercase">Design</span>
            <select 
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              disabled={autoMode}
              className={`w-full md:w-auto min-h-[48px] sm:min-h-[44px] bg-white/5 border border-white/10 text-white text-sm md:text-base font-sans rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/30 block p-3 outline-none appearance-none transition-colors ${autoMode ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer'}`}
              style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.2em', paddingRight: '2.5rem' }}
            >
              {PRESETS.map(p => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-white font-sans">{p.label}</option>
              ))}
            </select>
          </div>

          <div className="hidden md:block w-px h-10 bg-white/10"></div>

          {/* Color Picker */}
          <div className="flex flex-col items-start gap-2 md:gap-3 flex-shrink-0">
            <span className="text-[10px] sm:text-xs text-white/50 font-bold tracking-[0.2em] uppercase">Color</span>
            <label className={`relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 transition-all min-h-[48px] sm:min-h-[44px] ${autoColor ? 'opacity-40 cursor-not-allowed grayscale-[0.5]' : 'hover:bg-white/10 cursor-pointer'}`}>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)] relative flex-shrink-0">
                <input 
                  type="color" 
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    if (autoColor) setAutoColor(false);
                  }}
                  disabled={autoColor}
                  className={`absolute inset-0 w-full h-full opacity-0 z-10 ${autoColor ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ transform: 'scale(2)' }}
                />
                <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ backgroundColor: color }}></div>
              </div>
              <span className="text-white/90 text-sm font-mono tracking-wider pr-3 uppercase select-none">{color}</span>
            </label>
          </div>

        </div>

        <div className="hidden md:block w-px h-10 bg-white/10"></div>

        {/* Toggles */}
        <div className="flex items-center justify-center gap-8 sm:gap-6 w-full md:w-auto pt-4 md:pt-0 border-t border-white/10 md:border-t-0">
          <label className={`flex flex-col md:flex-row items-center cursor-pointer gap-2 md:gap-3 transition-opacity ${autoMode ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
            <span className="text-[10px] sm:text-xs text-white/50 font-bold tracking-[0.2em] uppercase order-2 md:order-1 mt-2 md:mt-0">Auto Design</span>
            <div className="relative order-1 md:order-2">
              <input type="checkbox" className="sr-only" checked={autoMode} onChange={() => setAutoMode(!autoMode)} />
              <div 
                className={`block w-14 h-8 rounded-full transition-all duration-300 ${autoMode ? '' : 'bg-white/10 border border-white/20'}`}
                style={{ backgroundColor: autoMode ? color : '' }}
              ></div>
              <div 
                className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${autoMode ? 'transform translate-x-6' : ''}`}
                style={{ boxShadow: autoMode ? `0 0 15px ${color}` : '' }}
              ></div>
            </div>
          </label>

          <label className={`flex flex-col md:flex-row items-center cursor-pointer gap-2 md:gap-3 transition-opacity ${autoColor ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
            <span className="text-[10px] sm:text-xs text-white/50 font-bold tracking-[0.2em] uppercase order-2 md:order-1 mt-2 md:mt-0">Auto Color</span>
            <div className="relative order-1 md:order-2">
              <input type="checkbox" className="sr-only" checked={autoColor} onChange={() => setAutoColor(!autoColor)} />
              <div 
                className={`block w-14 h-8 rounded-full transition-all duration-300 ${autoColor ? '' : 'bg-white/10 border border-white/20'}`}
                style={{ backgroundColor: autoColor ? color : '' }}
              ></div>
              <div 
                className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${autoColor ? 'transform translate-x-6' : ''}`}
                style={{ boxShadow: autoColor ? `0 0 15px ${color}` : '' }}
              ></div>
            </div>
          </label>
        </div>

      </div>
    </div>
  );
};
