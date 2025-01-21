const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const GIFEncoder = require('gifencoder');

const app = express();
const PORT = process.env.PORT || 3000;

// Register the italic font
registerFont(path.join(__dirname, 'fonts', 'Montserrat-BlackItalic.ttf'), { family: 'Montserrat' });

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

    // Apply italic effect (shear transform)
    const shearX = -0.2;
    ctx.transform(1, 0, shearX, 1, 0, 0);

    // Text styling
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 20;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let fontSize = 300;
    ctx.font = `${fontSize}px "Montserrat"`;

    // Menyesuaikan fontSize agar teks tidak keluar dari batas kanvas
    while (ctx.measureText(text).width > canvasSize - 2 * padding && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Montserrat"`;
    }

    // Membagi teks secara dinamis berdasarkan lebar kanvas
    const splitText = [];
    let tempLine = '';
    for (let i = 0; i < text.length; i++) {
        tempLine += text[i];
        if (ctx.measureText(tempLine).width > canvasSize - 2 * padding) {
            splitText.push(tempLine.trim());
            tempLine = '';
        }
    }
    if (tempLine) splitText.push(tempLine.trim());

    const totalHeight = splitText.length * lineHeight;
    const startY = (canvasSize - totalHeight) / 2 + lineHeight / 2;

    splitText.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.strokeText(line, canvas.width / 2, y);
        ctx.fillText(line, canvas.width / 2, y);
    });

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
    encoder.setRepeat(0); // Loop the GIF
    encoder.setDelay(100); // Delay per frame
    encoder.setQuality(20); // Quality of the GIF

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    const colors = ['#a7a7e7', '#a7c7e7', '#a7e7e7'];
    const totalFrames = 30;
    const bounceHeight = 50;

    function splitTextDynamically(ctx, text, canvasSize, padding) {
        const splitText = [];
        let tempLine = '';
        for (let i = 0; i < text.length; i++) {
            tempLine += text[i];
            if (ctx.measureText(tempLine).width > canvasSize - 2 * padding) {
                splitText.push(tempLine.trim());
                tempLine = '';
            }
        }
        if (tempLine) splitText.push(tempLine.trim());
        return splitText;
    }

    function drawText(ctx, color, yOffset, textLines) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 25;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let fontSize = 300;
        ctx.font = `${fontSize}px "Montserrat"`;

        // Menyesuaikan fontSize agar tidak keluar dari batas kanvas
        while (textLines.some(line => ctx.measureText(line).width > canvasSize - 2 * padding) && fontSize > 10) {
            fontSize--;
            ctx.font = `${fontSize}px "Montserrat"`;
        }

        const totalHeight = textLines.length * lineHeight;
        const startY = (canvasSize - totalHeight) / 2 + lineHeight / 2;

        textLines.forEach((line, index) => {
            const y = startY + index * lineHeight + yOffset;
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillText(line, canvas.width / 2, y);
        });
    }

    const splitText = splitTextDynamically(ctx, text, canvasSize, padding);

    for (let i = 0; i < totalFrames; i++) {
        const progress = i / totalFrames;
        const bounce = Math.sin(progress * Math.PI * 2) * bounceHeight;
        const color = colors[Math.floor(i / 3) % colors.length];

        drawText(ctx, color, bounce, splitText);
        encoder.addFrame(ctx);
    }

    encoder.finish();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
