import 'dotenv/config';

import express from 'express';
import internalCommands from './src/internalCommands.js';

const app = express();
app.use(express.json());

// Internal API for the dashboard (authenticated via X-BOT-SECRET)
app.use('/internal', internalCommands);

// Health check
app.get('/_/health', (req, res) => res.json({ ok: true, service: 'bot-http' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Bot HTTP server listening on port ${PORT}`);
});
