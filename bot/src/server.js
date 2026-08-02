import express from 'express';
import internalCommands from './internalCommands.js';

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

// Note: If you already have a bot process that logs into Discord, integrate this router
// by importing './internalCommands.js' and mounting it on your existing Express app.
