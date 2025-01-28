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

    // Set text styling
    ctx.fillStyle = '#FFFFFF'; // Fill color for the text
    ctx.strokeStyle = '#000000'; // Outline color
    ctx.lineWidth = 8; // Outline width
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let fontSize = 300;
    ctx.font = `${fontSize}px "Montserrat"`;

    // Adjust font size if the text is too wide
    while (ctx.measureText(text).width > canvasSize - 2 * padding && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Montserrat"`;
    }

    // Function to split text dynamically based on canvas width
    function splitTextDynamically(ctx, text, canvasWidth, padding) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = ctx.measureText(testLine).width;

            if (testWidth > canvasWidth - 2 * padding) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // Split the text into lines that fit within the canvas
    const splitText = splitTextDynamically(ctx, text, canvasSize, padding);

    const totalHeight = splitText.length * lineHeight;
    const startY = (canvasSize - totalHeight) / 2 + lineHeight / 2;

    // Apply rotation for slanted text
    const angle = -0.2; // Adjust this for more or less slant
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw each line with outline and fill
    splitText.forEach((line, index) => {
        const y = startY + index * lineHeight;

        // Draw outline (stroke) first
        ctx.strokeText(line, canvas.width / 2, y);

        // Draw text fill
        ctx.fillText(line, canvas.width / 2, y);
    });

    // Output the image
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
