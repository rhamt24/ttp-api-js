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

    const upperText = text.toUpperCase();
    const canvasSize = 800;
    const padding = 20;
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.strokeStyle = '#000000'; // Black outline
    ctx.lineWidth = 10; // Thicker outline
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let fontSize = 300;
    ctx.font = `${fontSize}px "Montserrat"`;
    let textWidth = ctx.measureText(upperText).width;

    while (textWidth > canvasSize - 2 * padding && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Montserrat"`;
        textWidth = ctx.measureText(upperText).width;
    }

    const rotationAngle = -5 * (Math.PI / 180);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotationAngle);

    ctx.strokeText(upperText, 0, 0);
    ctx.fillText(upperText, 0, 0);

    ctx.rotate(-rotationAngle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

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

    const upperText = text.toUpperCase();
    const canvasSize = 800;
    const padding = 20;
    const encoder = new GIFEncoder(canvasSize, canvasSize);

    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(500);
    encoder.setQuality(10);

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    encoder.setTransparent(0x000000);

    function drawText(ctx, color, rotationAngle) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000'; // Black outline
        ctx.lineWidth = 10; // Thicker outline
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let fontSize = 300;
        ctx.font = `${fontSize}px "Montserrat"`;
        let textWidth = ctx.measureText(upperText).width;

        while (textWidth > canvasSize - 2 * padding && fontSize > 10) {
            fontSize--;
            ctx.font = `${fontSize}px "Montserrat"`;
            textWidth = ctx.measureText(upperText).width;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotationAngle);

        ctx.strokeText(upperText, 0, 0);
        ctx.fillText(upperText, 0, 0);

        ctx.rotate(-rotationAngle);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    const frames = [
        { color: '#FF0000', angle: -5 * (Math.PI / 180) },
        { color: '#00FF00', angle: 5 * (Math.PI / 180) },
        { color: '#0000FF', angle: -10 * (Math.PI / 180) },
    ];

    for (const frame of frames) {
        drawText(ctx, frame.color, frame.angle);
        encoder.addFrame(ctx);
    }

    encoder.finish();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
