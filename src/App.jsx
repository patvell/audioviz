import { useState } from 'react';
import { UI } from './components/UI';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { initAudio } from './hooks/useAudio';
import { useAppStore } from './store/useAppStore';

function App() {
  const isStarted = useAppStore(state => state.isStarted);
  const setIsStarted = useAppStore(state => state.setIsStarted);
  const [error, setError] = useState('');

  const handleStart = async () => {
    const success = await initAudio();
    if (success) {
      setIsStarted(true);
    } else {
      setError('Microphone access is required to run the visualizer.');
    }
  };

  return (
    <>
      <VisualizerCanvas />
      <UI />

      <div 
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden transition-all duration-1000 ${
          !isStarted ? 'opacity-100 pointer-events-auto backdrop-blur-xl bg-black/40' : 'opacity-0 pointer-events-none backdrop-blur-none bg-black/0'
        }`}
      >
        {/* Liquid glass ambient background blobs */}
        <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-fuchsia-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className={`relative z-10 max-w-lg w-full text-center p-12 rounded-[3rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-1000 ${
          !isStarted ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          
          <h1 className="relative text-7xl font-black mb-4 bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent tracking-tighter drop-shadow-sm">
            VYBE
          </h1>
          
          <p className="relative text-zinc-300 mb-10 text-xl font-light tracking-wide">
            Immersive Audio Experience
          </p>

          <div className="relative mb-10 flex items-center justify-center gap-2 text-xs text-zinc-500 font-medium tracking-wide">
            <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Zero data stored. Private by design.</span>
          </div>

          <button 
            onClick={handleStart}
            className="relative group w-full px-8 py-5 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(168,85,247,0.2)] hover:shadow-[0_0_60px_rgba(168,85,247,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blend-overlay"></div>
            
            <div className="relative flex items-center justify-center gap-3 text-white font-bold text-lg tracking-wide">
              <svg className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Launch Visualizer
            </div>
          </button>
          
          {error && (
            <p className="relative text-pink-400 mt-6 text-sm bg-pink-500/10 p-3 rounded-xl border border-pink-500/20 backdrop-blur-md">
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
