import express from 'express';
import albumRouter from './routes/albuns.js';
import {initializeDatabase} from './database/connection.js';

const port=3000;
const app = express();
app.use(express.json());
app.use('/albums', albumRouter);
try {
  await initializeDatabase();
} catch (error) {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
}
app.listen (port, ()=>{
  console.log(`Server rodando na porta ${port}`);
})

