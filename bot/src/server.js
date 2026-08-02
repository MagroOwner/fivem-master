const express = require('express');
const internalCommands = require('./internalCommands');

const app = express();

// Parse JSON bodies for all routes
app.use(express.json());

// Mount internal routes under /internal
app.use('/internal', internalCommands);

// Health check
app.get('/_/health', (req, res) => res.json({ ok: true, service: 'bot-http' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Bot HTTP server listening on port ${PORT}`);
});

// Note: This server is intentionally minimal. If you already have a separate bot process
// that logs into Discord and runs a client, ensure this HTTP server runs alongside it
// (e.g., using a process manager) or integrate the routes into your existing bot code.
