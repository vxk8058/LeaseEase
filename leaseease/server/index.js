// ElevenLabs proxy server for LeaseEase
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`ElevenLabs proxy server running on port ${PORT}`);
});
