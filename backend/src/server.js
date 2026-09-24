import cors from 'cors';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT || 3001;
const dataUrl = new URL('../data/pipeline-status.json', import.meta.url);

app.use(cors());

app.get('/api/pipeline-status', async (_request, response, next) => {
  try {
    const data = await readFile(dataUrl, 'utf8');
    response.json(JSON.parse(data));
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Unable to read pipeline status data.' });
});

app.listen(port, () => {
  console.log(`Pipeline Pulse API listening on http://localhost:${port}`);
});