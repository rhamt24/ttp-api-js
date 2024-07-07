const express = require('express');
const { createCanvas } = require('canvas');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/text-to-picture', (req, res) => {
    const { text, format = 'png' } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvas = createCanvas(800, 200);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text styling
    ctx.fillStyle = '#000000';
    ctx.font = '48px sans-serif';
    ctx.fillText(text, 50, 100);

    // Convert canvas to image
    if (format === 'jpg' || format === 'jpeg') {
        const buffer = canvas.toBuffer('image/jpeg');
        res.set('Content-Type', 'image/jpeg');
        res.send(buffer);
    } else {
        const buffer = canvas.toBuffer('image/png');
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
