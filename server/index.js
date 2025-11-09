const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

if (!ELEVEN_KEY) {
  console.warn('Warning: ELEVENLABS_API_KEY is not set. /api/tts will return 500 until you set it.');
}

app.post('/api/tts', async (req, res) => {
  try{
    if (!ELEVEN_KEY) return res.status(500).json({ error: 'Server not configured with ElevenLabs API key' });

    const text = req.body?.text || '';
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    // The ElevenLabs API accepts JSON with text and optional voice_settings
    const payload = { text, voice_settings: { stability: 0.3, similarity_boost: 0.75 } };

    const response = await axios.post(url, payload, {
      responseType: 'arraybuffer',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      }
    });

    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(response.data));
  }catch(err){
    console.error('tts error', err?.response?.data || err.message || err);
    res.status(500).json({ error: 'TTS failed' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`LeaseEase TTS proxy running on http://localhost:${port}`));
