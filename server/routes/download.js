import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Download file
router.get('/:filename', (req, res) => {
    const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
    res.download(filePath, (err) => {
        if (err) {
            console.error('Download error:', err);
            res.status(404).json({ message: 'File not found.' });
        }
    });
});

export default router;
