const express = require('express');
const path = require('path');
const db = require('./config/database');
const routes = require('./routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', routes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});