// ElevenLabs proxy server for LeaseEase
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
// Always load env from this folder so it works via the wrapper too
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger to help debug proxy behavior
app.use((req, res, next) => {
  try {
    console.log(`[proxy] ${req.method} ${req.url}`);
  } catch {}
  next();
});

const fs = require('fs');
const RESPONSES_FILE = path.join(__dirname, 'responses.txt');

// ensure file exists
try {
  if (!fs.existsSync(RESPONSES_FILE)) fs.writeFileSync(RESPONSES_FILE, '');
} catch (e) {
  console.warn('Could not ensure responses file:', e.message);
}

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const ELEVEN_VOICE_ID = 'Qggl4b0xRMiqOwhPtVWT'; // Default voice, can be changed

if (!ELEVEN_API_KEY) {
  console.warn('Warning: ELEVEN_API_KEY is not set in environment. TTS calls will fail until it is provided.');
}

app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  if (!ELEVEN_API_KEY) return res.status(500).json({ error: 'Server missing ELEVEN_API_KEY for ElevenLabs TTS' });
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      data: {
        text,
        model_id: 'eleven_multilingual_v2', //natural voice
        voice_settings: {
          stability: 0.2, // lower = more natural, less robotic
          similarity_boost: 0.8, // higher = more like the original voice
          style: 0.3, // 0 = calm, 1 = expressive
          use_speaker_boost: true
        },
      },
      responseType: 'arraybuffer',
    });
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);
  } catch (err) {
    console.error('TTS proxy error:', err && err.message ? err.message : err);
    if (err.response) {
      console.error('ElevenLabs response status:', err.response.status);
      console.error('ElevenLabs response data:', err.response.data);
    }
    return res.status(500).json({ error: err.message || 'TTS proxy error', status: err.response && err.response.status, details: err.response && err.response.data });
  }
});

// Append a user response to the responses.txt file
app.post('/api/log-response', async (req, res) => {
  try {
    const { questionKey, questionPrompt, answer } = req.body || {};
    if (!answer) return res.status(400).json({ error: 'No answer provided' });
    const timestamp = new Date().toISOString();
    const line = `${timestamp}\t${questionKey || ''}\t${questionPrompt || ''}\t${answer}\n`;
    fs.appendFile(RESPONSES_FILE, line, (err) => {
      if (err) {
        console.error('Failed to append response:', err);
        return res.status(500).json({ error: 'Failed to write response' });
      }
      return res.json({ ok: true });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Clear the responses file (support GET/POST for convenience)
app.all('/api/clear-responses', (req, res) => {
  try {
    fs.writeFileSync(RESPONSES_FILE, '');
    return res.json({ ok: true });
  } catch (err) {
    console.error('Failed to clear responses file:', err);
    return res.status(500).json({ error: err.message });
  }
});

<<<<<<< Updated upstream
=======
// Proxy endpoint: forward /api/cars to the toyota-db API server
app.get('/api/cars', async (req, res) => {
  const { maxMonthly, limit } = req.query;
  const TOYOTA_DB_BASE = process.env.TOYOTA_DB_URL || 'http://localhost:5002';
  const upstreamUrl = `${TOYOTA_DB_BASE.replace(/\/$/, '')}/cars?maxMonthly=${encodeURIComponent(maxMonthly || '')}&limit=${encodeURIComponent(limit || 5)}`;
  try {
    const resp = await axios.get(upstreamUrl, { timeout: 8000 });
    if (resp && resp.data) return res.json(resp.data);
    return res.status(502).json({ ok: false, error: 'Invalid response from toyota-db', upstreamUrl });
  } catch (err) {
    console.error('Proxy /api/cars error:', err && err.message ? err.message : err);
    if (err.response && err.response.data) console.error('toyota-db response:', err.response.data);
    const status = (err.response && err.response.status) || 500;
    return res.status(status).json({ ok: false, error: err.message || 'Proxy error', upstreamUrl, upstreamStatus: status });
  }
});

// Health endpoint to quickly validate connectivity
app.get('/api/health', async (req, res) => {
  const TOYOTA_DB_BASE = process.env.TOYOTA_DB_URL || 'http://localhost:5002';
  const upstreamUrl = `${TOYOTA_DB_BASE.replace(/\/$/, '')}/cars?limit=1`;
  try {
    const r = await axios.get(upstreamUrl, { timeout: 3000 });
    res.json({ ok: true, toyotaDb: true, upstreamUrl, sample: Array.isArray(r.data) ? r.data.length : (r.data && r.data.cars ? r.data.cars.length : null) });
  } catch (e) {
    res.status(503).json({ ok: false, toyotaDb: false, upstreamUrl, error: e.message });
  }
});

// Default to 5001 since frontend expects the proxy on that port in dev
>>>>>>> Stashed changes
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`ElevenLabs proxy server running on port ${PORT}`);
});
