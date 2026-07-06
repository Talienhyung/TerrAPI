const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const { sequelize, Measure } = require('./db');
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Index.html'));
});

// Stockage de la dernière mesure
let lastData = {
  temperature: null,
  humidity: null,
  timestamp: null,
  receivedAt: null
};

// Clients SSE connectés
let sseClients = [];

// ─────────────────────────────────────────
// Route POST : reçoit les données de l'ESP32
// ─────────────────────────────────────────
app.post('/api/data', (req, res) => {
  const { temperature, humidity, timestamp } = req.body;

  if (temperature === undefined || humidity === undefined) {
    return res.status(400).json({ error: 'Champs temperature et humidity requis' });
  }

  lastData = {
    temperature,
    humidity,
    timestamp,
    receivedAt: new Date().toISOString()
  };
  Measure.create(lastData).catch(console.error);

  console.log(`[${lastData.receivedAt}] Temp: ${temperature}°C | Humidité: ${humidity}%`);

  // Diffusion aux clients SSE connectés
  const payload = JSON.stringify(lastData);
  sseClients = sseClients.filter(client => {
    try { client.write(`data: ${payload}\n\n`); return true; }
    catch { return false; }
  });

  res.json({ status: 'ok', clients: sseClients.length });
});

// ─────────────────────────────────────────
// Route GET : renvoie la dernière mesure
// ─────────────────────────────────────────
app.get('/api/data', (req, res) => {
  res.json(lastData);
});

// ─────────────────────────────────────────
// Route SSE : stream temps réel vers le navigateur
// ─────────────────────────────────────────
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Envoi immédiat de la dernière valeur connue
  if (lastData.temperature !== null) {
    res.write(`data: ${JSON.stringify(lastData)}\n\n`);
  }

  sseClients.push(res);
  console.log(`Client SSE connecté (${sseClients.length} actif(s))`);

  // Nettoyage à la déconnexion
  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
    console.log(`Client SSE déconnecté (${sseClients.length} actif(s))`);
  });
});

// ─────────────────────────────────────────
// Démarrage du serveur
// ─────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n✅ Serveur démarré sur http://0.0.0.0:${PORT}`);
  console.log(`   Page web    → http://localhost:${PORT}`);
  console.log(`   API data    → http://localhost:${PORT}/api/data`);
  console.log(`   SSE stream  → http://localhost:${PORT}/api/stream\n`);

  // Test de connexion à la base de données
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync().then(() => {
      console.log("All models were synchronized successfully.");
    }).catch(console.error);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});