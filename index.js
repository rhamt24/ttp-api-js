const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Register the font
registerFont(path.join(__dirname, 'fonts', 'Roboto-Regular.ttf'), { family: 'Roboto' });

app.get('/text-to-picture', (req, res) => {
    const { text, format = 'png' } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasSize = 800;
    const padding = 20;
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text styling
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Function to split text into multiple lines
    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let lines = [];
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        for (let i = 0; i < lines.length; i++) {
            context.fillText(lines[i], x, y);
            y += lineHeight;
        }
    }

    // Determine the maximum font size that fits the canvas width
    let fontSize = 150;
    ctx.font = `${fontSize}px "Roboto"`;
    let textWidth = ctx.measureText(text).width;
    while (textWidth > canvasSize - 2 * padding && fontSize > 10) { // Subtract padding
        fontSize--;
        ctx.font = `${fontSize}px "Roboto"`;
        textWidth = ctx.measureText(text).width;
    }

    const lineHeight = fontSize * 1.2;
    const maxTextWidth = canvasSize - 2 * padding;

    // Check if the text fits in one line
    if (textWidth <= maxTextWidth) {
        ctx.fillText(text, canvasSize / 2, canvasSize / 2);
    } else {
        wrapText(ctx, text, canvasSize / 2, canvasSize / 2 - (lineHeight * (text.split(' ').length - 1) / 2), maxTextWidth, lineHeight);
    }

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
        
