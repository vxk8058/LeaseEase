// Speech helper with preloading and better error handling
const audioCache = new Map();
let currentAudio = null;

// Preload audio for text
export async function preloadAudio(text) {
  if (!text || audioCache.has(text)) return;
  try {
    const resp = await fetch('http://localhost:5001/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!resp.ok) throw new Error('TTS failed');
    const audioData = await resp.arrayBuffer();
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.src = url;
    await new Promise((resolve) => {
      audio.oncanplaythrough = resolve;
      audio.load();
    });
    audioCache.set(text, { audio, url });
  } catch (err) {
    console.warn('Failed to preload audio:', err);
  }
}

// Clean up audio resources
function cleanupAudio(text) {
  const cached = audioCache.get(text);
  if (cached) {
    URL.revokeObjectURL(cached.url);
    audioCache.delete(text);
  }
}

// Play audio with better handling
export async function speak(text) {
  if (!text) return;
  
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  try {
    // Try to use cached audio first
    let audio;
    if (audioCache.has(text)) {
      const cached = audioCache.get(text);
      audio = cached.audio;
      audio.currentTime = 0;
    } else {
      // Load new audio if not cached
      const resp = await fetch('http://localhost:5001/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!resp.ok) throw new Error('TTS failed');
      const audioData = await resp.arrayBuffer();
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      audio = new Audio(url);
      audioCache.set(text, { audio, url });
    }

    currentAudio = audio;
    await new Promise((resolve, reject) => {
      audio.onended = () => {
        currentAudio = null;
        resolve();
      };
      audio.onerror = (e) => {
        currentAudio = null;
        reject(e);
      };
      audio.play().catch(reject);
    });

  } catch (err) {
    console.warn('Speech failed, falling back to browser TTS:', err);
    currentAudio = null;
    // fallback to browser TTS
    if (window.speechSynthesis) {
      return new Promise((resolve) => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.onend = () => resolve();
        window.speechSynthesis.speak(utter);
      });
    }
  }
}

export function listen({lang = 'en-US', timeout = 8000} = {}) {
  // Try browser SpeechRecognition (webkit prefix) then fallback to prompt
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    // fallback to prompt
    return Promise.resolve(window.prompt('Type your reply (Speech recognition not available):'));
  }

  return new Promise((resolve, reject) => {
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        rec.stop();
        resolve('');
      }
    }, timeout);

    rec.onresult = (e) => {
      finished = true;
      clearTimeout(timer);
      const text = e.results[0][0].transcript;
      resolve(text);
    };
    rec.onerror = (e) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve('');
      }
    };
    rec.onend = () => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve('');
      }
    };
    try {
      rec.start();
    } catch (err) {
      clearTimeout(timer);
      resolve('');
    }
  });
}
