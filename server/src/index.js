import app from './app.js';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

// Serve frontend static files in production mode if dist folder exists
const distPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        res.status(404).send('Servidor CVNETGEST ativo. Inicie o cliente Vite para ambiente de desenvolvimento.');
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor CVNETGEST a rodar na porta ${PORT} (http://localhost:${PORT})`);
});
