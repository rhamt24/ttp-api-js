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
    const canvasSize = 800;
    const padding = 20;
    const encoder = new GIFEncoder(canvasSize, canvasSize);

    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0); // 0 for infinite repeat
    encoder.setDelay(500); // Delay per frame in ms
    encoder.setQuality(10); // Image quality (lower is better)

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // Ensure background is transparent
    encoder.setTransparent(0x000000);

    // Function to draw text
    function drawText(ctx, color, rotationAngle) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Text styling
        ctx.fillStyle = color;
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
        ctx.translate(canvas.width / 2, canvas.height / 2); // Move to center
        ctx.rotate(rotationAngle);

        // Draw the text
        ctx.strokeText(upperText, 0, 0); // Outline
        ctx.fillText(upperText, 0, 0); // Fill

        // Reset rotation
        ctx.rotate(-rotationAngle);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Colors and angles for frames
    const frames = [
        { color: '#FF0000', angle: -5 * (Math.PI / 180) }, // Red with -5° tilt
        { color: '#00FF00', angle: 5 * (Math.PI / 180) },  // Green with 5° tilt
        { color: '#0000FF', angle: -10 * (Math.PI / 180) }, // Blue with -10° tilt
    ];

    // Generate frames
    for (const frame of frames) {
        drawText(ctx, frame.color, frame.angle);
        encoder.addFrame(ctx);
    }

    encoder.finish();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
