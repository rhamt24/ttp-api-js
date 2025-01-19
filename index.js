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

    // Clear the background (transparent)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Text styling
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.strokeStyle = '#000000'; // Black outline
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Determine font size
    let fontSize = 300; // Start large
    ctx.font = `${fontSize}px "Montserrat"`;
    let textWidth = ctx.measureText(upperText).width;

    while (textWidth > canvasSize - 2 * padding && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Montserrat"`;
        textWidth = ctx.measureText(upperText).width;
    }

    // Rotate the canvas slightly
    const rotationAngle = -5 * (Math.PI / 180); // Tilt by -5 degrees
    ctx.translate(canvas.width / 2, canvas.height / 2); // Move to center
    ctx.rotate(rotationAngle);

    // Draw the text
    ctx.strokeText(upperText, 0, 0); // Outline
    ctx.fillText(upperText, 0, 0); // Fill

    // Reset rotation
    ctx.rotate(-rotationAngle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

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

/**
 * Animated Text-to-Picture (ATTP)
 */
app.get('/animated-text-to-picture', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const upperText = text.toUpperCase();
    const canvasSize = 500;
    const padding = 50;
    const encoder = new GIFEncoder(canvasSize, canvasSize);

    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0); 
    encoder.setDelay(100); // Delay per frame (100ms)
    encoder.setQuality(20); 

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    const colors = ['#a7a7e7', '#a7c7e7', '#a7e7e7'];

    const totalFrames = 30; 
    const bounceHeight = 100;
    const baseY = canvasSize / 2;

    function drawText(ctx, color, yOffset) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 25;
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

        ctx.strokeText(upperText, canvas.width / 2, baseY + yOffset);
        ctx.fillText(upperText, canvas.width / 2, baseY + yOffset);
    }

    for (let i = 0; i < totalFrames; i++) {
        const progress = i / totalFrames;
        const bounce = Math.sin(progress * Math.PI * 2) * bounceHeight;
        const color = colors[Math.floor(i / 3) % colors.length];

        drawText(ctx, color, bounce);
        encoder.addFrame(ctx);
    }

    encoder.finish();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
