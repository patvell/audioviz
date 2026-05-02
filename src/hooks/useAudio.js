export const audioData = {
  lows: 0,
  mids: 0,
  highs: 0,
  volume: 0,
};

let audioCtx = null;
let analyser = null;
let source = null;
let dataArray = null;
let isInitialized = false;

export const initAudio = async () => {
  if (isInitialized) return true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512; // 256 frequency bins
    
    source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    isInitialized = true;
    return true;
  } catch (err) {
    console.error('Error accessing microphone:', err);
    return false;
  }
};

export const updateAudioData = () => {
  if (!isInitialized || !analyser) return audioData;
  
  analyser.getByteFrequencyData(dataArray);
  
  // AudioContext sample rate is usually 44100Hz or 48000Hz.
  // Nyquist frequency is ~22050Hz.
  // We have 256 bins, so each bin is ~86Hz.
  // Lows: 0-3 bins (0-250Hz approx)
  // Mids: 4-46 bins (250-4000Hz approx)
  // Highs: 47-255 bins (4000Hz+)
  
  let lowSum = 0;
  for (let i = 0; i < 4; i++) lowSum += dataArray[i];
  let rawLows = (lowSum / 4) / 255;
  
  let midSum = 0;
  for (let i = 4; i < 47; i++) midSum += dataArray[i];
  let rawMids = (midSum / 43) / 255;
  
  let highSum = 0;
  for (let i = 47; i < 256; i++) highSum += dataArray[i];
  let rawHighs = (highSum / 209) / 255;

  // Silence as extreme weakness: square the values. 
  // This heavily penalizes low volumes (e.g. 0.2 -> 0.04) 
  // but keeps loud volumes strong (e.g. 0.9 -> 0.81).
  audioData.lows = Math.pow(rawLows, 2.0);
  audioData.mids = Math.pow(rawMids, 2.0);
  audioData.highs = Math.pow(rawHighs, 2.0);
  
  let totalRaw = (rawLows + rawMids + rawHighs) / 3.0;
  audioData.volume = Math.pow(totalRaw, 2.0);

  return audioData;
};

export const getAudioData = () => audioData;
