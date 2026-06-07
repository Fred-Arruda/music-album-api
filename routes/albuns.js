import {Router} from 'express';
import db from '../database/connection.js';

const router = Router();

router.post('/', (req, res)=> {

    const {artist, album, rating, comment} = req.body;
    
    if (!artist || !album) {
        return res.status(400).json({ error: 'Os campos "artist" e "album" são obrigatórios.' });
    }
    db.run('INSERT INTO albums (artist, album, rating, comment) VALUES (?, ?, ?, ?)', [artist, album, rating, comment], function(err) {
    if (err) {
        console.error('Erro ao inserir álbum:', err.message);
        return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Álbum adicionado com sucesso!' });
});});




router.get('/', (req, res) => {
    db.all('SELECT * FROM albums', [], (err, rows) => {
        if (err) { return res.status(500).json({error: err.message}); }
        res.json(rows);
    });
});

export default router;