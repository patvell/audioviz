import { create } from 'zustand';

const PRESET_IDS = ['liquid', 'wireframe', 'nebula', 'synthwave', 'kaleidoscope', 'synapse', 'cymatics', 'singularity', 'prism', 'aurora'];
const INITIAL_PRESET = PRESET_IDS[Math.floor(Math.random() * PRESET_IDS.length)];

export const useAppStore = create((set) => ({
  preset: INITIAL_PRESET,
  color: '#a855f7', // Default startup purple
  isStarted: false,
  autoMode: false,
  autoColor: false,
  setPreset: (updater) => set((state) => ({ preset: typeof updater === 'function' ? updater(state.preset) : updater })),
  setColor: (updater) => set((state) => ({ color: typeof updater === 'function' ? updater(state.color) : updater })),
  setIsStarted: (isStarted) => set({ isStarted }),
  setAutoMode: (autoMode) => set({ autoMode }),
  setAutoColor: (autoColor) => set({ autoColor }),
}));
