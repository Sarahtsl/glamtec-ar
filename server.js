import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques du dossier dist
app.use(express.static(path.join(__dirname, 'dist')));

// ar-product.html avec query string
app.get('/ar-product.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'ar-product.html'));
});

// Redirect /ar-product → ar-product.html (serve strips .html)
app.get('/ar-product', (req, res) => {
  const query = req.query.product ? `?product=${req.query.product}` : '';
  res.sendFile(path.join(__dirname, 'dist', 'ar-product.html'));
});

// Toutes les autres routes → index.html (React SPA)
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});