import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { getLocalIp } from './utils/network.js';
import { createSafePhotoFilename, parsePngDataUrl, resolveUploadPath } from './utils/photos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT ?? 4000);
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');

app.use(cors());
app.use(express.json({ limit: '30mb' }));

await fs.mkdir(uploadDir, { recursive: true });

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'children-day-photo-booth',
    localIp: getLocalIp(),
    port
  });
});

app.post('/api/photos', async (req, res) => {
  try {
    const { imageData } = req.body as { imageData?: string };
    const imageBuffer = parsePngDataUrl(imageData ?? '');
    const filename = createSafePhotoFilename();
    const uploadPath = resolveUploadPath(uploadDir, filename);

    await fs.writeFile(uploadPath, imageBuffer);

    const hostIp = getLocalIp();
    res.status(201).json({
      filename,
      url: `http://${hostIp}:${port}/download/${filename}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';

    if (message === 'INVALID_IMAGE_DATA' || message === 'INVALID_BASE64') {
      res.status(400).json({ error: 'Valid PNG data URL is required.' });
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'Failed to save image.' });
  }
});

app.get('/download/:filename', async (req, res) => {
  const filename = path.basename(req.params.filename);
  const uploadPath = resolveUploadPath(uploadDir, filename);

  try {
    await fs.access(uploadPath);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(uploadPath);
  } catch {
    res.status(404).json({ error: 'Photo not found.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  const hostIp = getLocalIp();
  console.log(`Photo booth backend: http://${hostIp}:${port}`);
});
