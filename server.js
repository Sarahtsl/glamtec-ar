const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques du dossier dist
app.use(express.static(path.join(__dirname, 'dist')));

// ar-product.html avec query string
app.get('/ar-product.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'ar-product.html'));
});

// Toutes les autres routes → index.html (React SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});