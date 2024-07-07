const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const GIFEncoder = require('gifencoder');

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

    // Determine the maximum font size that fits the canvas width and height
    let fontSize = 300; // Start with a larger font size
    ctx.font = `${fontSize}px "Roboto"`;
    let textWidth = ctx.measureText(text).width;
    let lineHeight = fontSize * 1.2;
    let textHeight = lineHeight;

    while ((textWidth > canvasSize - 2 * padding || textHeight > canvasSize - 2 * padding) && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Roboto"`;
        textWidth = ctx.measureText(text).width;
        lineHeight = fontSize * 1.2;
        textHeight = lineHeight * Math.ceil(textWidth / (canvasSize - 2 * padding));
    }

    const maxTextWidth = canvasSize - 2 * padding;

    // Check if the text fits in one line
    if (textWidth <= maxTextWidth) {
        ctx.fillText(text, canvasSize / 2, canvasSize / 2);
    } else {
        wrapText(ctx, text, canvasSize / 2, padding + lineHeight / 2, maxTextWidth, lineHeight);
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

app.get('/animated-text-to-picture', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasSize = 800;
    const padding = 20;
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

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

    // Determine the maximum font size that fits the canvas width and height
    let fontSize = 300; // Start with a larger font size
    ctx.font = `${fontSize}px "Roboto"`;
    let textWidth = ctx.measureText(text).width;
    let lineHeight = fontSize * 1.2;
    let textHeight = lineHeight;

    while ((textWidth > canvasSize - 2 * padding || textHeight > canvasSize - 2 * padding) && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Roboto"`;
        textWidth = ctx.measureText(text).width;
        lineHeight = fontSize * 1.2;
        textHeight = lineHeight * Math.ceil(textWidth / (canvasSize - 2 * padding));
    }

    const maxTextWidth = canvasSize - 2 * padding;

    // Function to draw text with gradient
    function drawText(frame) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create gradient
        const gradient = ctx.createLinearGradient(
            canvasSize - frame * (canvasSize / 100), 0,
            canvasSize + frame * (canvasSize / 100), 0
        );
        gradient.addColorStop(0, '#ff00ff'); // pink
        gradient.addColorStop(0.5, '#0000ff'); // blue
        gradient.addColorStop(1, '#ff00ff'); // pink

        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'source-in';

        if (textWidth <= maxTextWidth) {
            ctx.fillText(text, canvasSize / 2, canvasSize / 2);
        } else {
            wrapText(ctx, text, canvasSize / 2, padding + lineHeight / 2, maxTextWidth, lineHeight);
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    // Create animated gradient text
    const encoder = new GIFEncoder(canvasSize, canvasSize);
    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);
    encoder.start();
    encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
    encoder.setDelay(50); // frame delay in ms
    encoder.setQuality(10); // image quality. 10 is default.

    for (let i = 0; i < 100; i++) { // number of frames
        drawText(i);
        encoder.addFrame(ctx);
    }

    encoder.finish();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
                 
