import express from 'express';
import albumRouter from './routes/albuns.js';
//import sqlite3 from 'sqlite3';

const app = express();
app.use(express.json());
app.use('/albums', albumRouter);
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

app.use(express.json());

/*const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  }
else { console.log('Conexão com o banco de dados estabelecida com sucesso.'); }
});

db.run('CREATE TABLE IF NOT EXISTS albums (id INTEGER PRIMARY KEY AUTOINCREMENT, artist TEXT NOT NULL, album TEXT NOT NULL, rating INTEGER NOT NULL, comment TEXT)');*/