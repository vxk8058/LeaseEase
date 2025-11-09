const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'LeaseEase server running' });
});

// Example health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Simple responses logging endpoints
const fs = require('fs');
const path = require('path');
const RESP_FILE = path.join(__dirname, 'responses.txt');

// Append a JSON line with timestamp for each logged response
app.post('/api/log-response', (req, res) => {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      payload: req.body,
    };
    const line = JSON.stringify(entry) + '\n';
    // ensure folder exists (it is server root) and append
    fs.appendFile(RESP_FILE, line, (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to append response', err);
        return res.status(500).json({ error: 'failed to log response' });
      }
      return res.status(204).end();
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Exception logging response', e);
    return res.status(500).json({ error: 'exception' });
  }
});

// Clear/truncate responses file (used on unload)
app.post('/api/clear-responses', (req, res) => {
  try {
    fs.writeFile(RESP_FILE, '', (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to clear responses', err);
        return res.status(500).json({ error: 'failed to clear' });
      }
      return res.status(204).end();
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Exception clearing responses', e);
    return res.status(500).json({ error: 'exception' });
  }
});

// Optional: fetch current responses (for debugging)
app.get('/api/responses', (req, res) => {
  fs.readFile(RESP_FILE, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json([]);
      return res.status(500).json({ error: 'failed to read' });
    }
    const lines = data.split('\n').filter(Boolean).map((l) => {
      try { return JSON.parse(l); } catch (e) { return { raw: l }; }
    });
    return res.json(lines);
  });
});

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`LeaseEase server listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(`Port ${PORT} is already in use.\n` +
      `- Option 1: stop the process using the port (e.g. \`lsof -iTCP:${PORT} -sTCP:LISTEN -n -P\` then \`kill <PID>\`).\n` +
      `- Option 2: start the server on another port: \`PORT=5001 npm start\`\n` +
      `- Option 3: set PORT in server/.env to a free port.`);
    process.exit(1);
  }
  // Re-throw for other errors
  throw err;
});
