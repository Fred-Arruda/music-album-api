import {Router} from 'express';
import db from '../database/connection.js';

const router = Router();

router.post('/', (req, res)=> {

    const {artist, album, rating, comment} = req.body;

    if ( typeof artist !== 'string'  || artist.trim().length === 0){
        return res.status(400).json({
            error: 'Artist is required.'
        });
    }
    if (typeof album !== 'string' || album.trim().length ===0){
        return res.status(400).json({
            error: 'Album is required'
        });
    }
    if (!Number.isInteger(rating) || rating < 0 || rating > 10){
        return res.status(400).json({
            error: 'Rating must be between 0 and 10'
        });
    }
    if (typeof comment === 'string' && comment.length > 500){
        return res.status(400).json({
            error: 'Comment must have at most 500 characters.'
        });
    }
    if (comment !== null && typeof comment !== 'string'){
        return res.status(400).json({
            error: 'Comment must be a string'
        });
    }

db.run (`INSERT INTO albums (artist, album, rating, comment)
    VALUES(?,?,?,?)`,
[   artist.trim(),
    album.trim(),
    rating,
    comment?.trim() || null
],
function (error){
    if (error){
        console.log ('Error creating album:', error.message);
        return res.status(500).json({
            error: 'Could not create album.'
        });
    }
return res.status(201).json({
    id: this.lastID,
    message: 'Album create successfully.'});
        }
    );
});




router.get('/', (req, res) => {
    db.all('SELECT * FROM albums', [], (err, rows) => {
        if (err) { return res.status(500).json({error: err.message}); }
        res.json(rows);
    });
});

export default router;