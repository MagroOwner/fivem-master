import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import internalCommands from './src/internalCommands.js';

async function tryImportBotEntrypoints() {
  const candidates = ['./src/index.js', './src/main.js', './src/bot.js', './src/app.js'];
  for (const p of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const mod = await import(p);
      console.log(`Imported bot entry point: ${p}`);
      // If the module exports an init function, call it
      if (mod && typeof mod.init === 'function') {
        try {
          await mod.init();
          console.log(`Called init() exported by ${p}`);
        } catch (err) {
          console.warn(`init() in ${p} threw:`, err);
        }
      }
      return true;
    } catch (err) {
      // continue to next candidate
    }
  }
  console.warn('No bot entrypoint found among candidates. If you have a different entry file, edit bot/index.js to import it.');
  return false;
}

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

// Try to import existing bot entrypoints so the bot client runs in the same process.
tryImportBotEntrypoints().then((ok) => {
  if (!ok) {
    console.warn('Bot client was not automatically started. Ensure you import your bot entry file here.');
  }
});
