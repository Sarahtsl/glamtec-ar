import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import generateRoute from './routes/generate.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Servir les fichiers .glb générés
app.use('/models', express.static(join(__dirname, 'uploads')));

app.use('/api', generateRoute);

app.get('/', (req, res) => {
  res.json({ message: 'GlamTec Backend OK ✅' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});