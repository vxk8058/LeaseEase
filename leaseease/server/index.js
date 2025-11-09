// ElevenLabs proxy server for LeaseEase
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const fs = require('fs');
const path = require('path');
const RESPONSES_FILE = path.join(__dirname, 'responses.txt');

// ensure file exists
try {
  if (!fs.existsSync(RESPONSES_FILE)) fs.writeFileSync(RESPONSES_FILE, '');
} catch (e) {
  console.warn('Could not ensure responses file:', e.message);
}

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const ELEVEN_VOICE_ID = 'Qggl4b0xRMiqOwhPtVWT'; // Default voice, can be changed

app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
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
    res.status(500).json({ error: err.message });
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`ElevenLabs proxy server running on port ${PORT}`);
});
