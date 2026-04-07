import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateModel } from './tripoController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Route principale : image → 3D → QR
app.post('/api/generate', generateModel);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});