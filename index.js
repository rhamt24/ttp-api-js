const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const GIFEncoder = require('gifencoder');

const app = express();
const PORT = process.env.PORT || 3000;

// Register fonts
registerFont(path.join(__dirname, 'fonts', 'Montserrat-BlackItalic.ttf'), { family: 'Montserrat' });
registerFont(path.join(__dirname, 'fonts', 'arialnarrow.ttf'), { family: 'ArialNarrow' });

/**
 * Static Text-to-Picture (TTP)
 */
app.get('/text-to-picture', (req, res) => {
    const { text, format = 'png' } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasSize = 800;
    const padding = 20;
    const lineHeight = 100;
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let fontSize = 300;
    ctx.font = `${fontSize}px "Montserrat"`;

    while (ctx.measureText(text).width > canvasSize - 2 * padding && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Montserrat"`;
    }

    const totalHeight = lineHeight;
    const y = (canvasSize - totalHeight) / 2 + lineHeight / 2;

    ctx.strokeText(text, canvas.width / 2, y);
    ctx.fillText(text, canvas.width / 2, y);

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

/**
 * Animated Text-to-Picture (ATTP)
 */
app.get('/animated-text-to-picture', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasSize = 500;
    const padding = 50;
    const lineHeight = 70;
    const encoder = new GIFEncoder(canvasSize, canvasSize);

    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(100);
    encoder.setQuality(20);

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    const colors = ['#a7a7e7', '#a7c7e7', '#a7e7e7'];
    const totalFrames = 30;
    const bounceHeight = 50;

    const textLines = text.split(' ');

    for (let i = 0; i < totalFrames; i++) {
        const progress = i / totalFrames;
        const bounce = Math.sin(progress * Math.PI * 2) * bounceHeight;
        const color = colors[Math.floor(i / 3) % colors.length];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let fontSize = 50;
        ctx.font = `${fontSize}px "Montserrat"`;

        const totalHeight = textLines.length * lineHeight;
        const startY = (canvasSize - totalHeight) / 2 + lineHeight / 2;

        textLines.forEach((line, index) => {
            const y = startY + index * lineHeight + bounce;
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillText(line, canvas.width / 2, y);
        });

        encoder.addFrame(ctx);
    }

    encoder.finish();
});

/**
 * Static Text-to-Picture (brat)
 */
app.get('/brat', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasWidth = 800;
    const canvasHeight = 400;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '40px ArialNarrow';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer());
});

/**
 * Animated Text-to-GIF (bratvid)
 */
app.get('/bratvid', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasWidth = 800;
    const canvasHeight = 400;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    const encoder = new GIFEncoder(canvasWidth, canvasHeight);

    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(500);
    encoder.setQuality(10);

    const lines = text.split(' ');
    const yPosition = canvasHeight / 2;

    for (let i = 1; i <= lines.length; i++) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '40px ArialNarrow';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const currentText = lines.slice(0, i).join(' ');
        ctx.fillText(currentText, canvasWidth / 2, yPosition);

        encoder.addFrame(ctx);
    }

    encoder.finish();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
