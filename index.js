const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const GIFEncoder = require('gifencoder');

const app = express();
const PORT = process.env.PORT || 3000;

// Register the font
registerFont(path.join(__dirname, 'fonts', 'Montserrat-Bold.ttf'), { family: 'Montserrat' });

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

    // Background (transparent)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Text styling
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.strokeStyle = '#000000'; // Black outline
    ctx.lineWidth = 4;
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
            context.strokeText(lines[i], x, y); // Draw outline
            context.fillText(lines[i], x, y); // Draw text
            y += lineHeight;
        }
    }

    // Determine the maximum font size that fits the canvas width and height
    let fontSize = 300; // Start with a larger font size
    ctx.font = `${fontSize}px "Montserrat"`;
    let textWidth = ctx.measureText(upperText).width;
    let lineHeight = fontSize * 1.2;
    let textHeight = lineHeight;

    while ((textWidth > canvasSize - 2 * padding || textHeight > canvasSize - 2 * padding) && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Montserrat"`;
        textWidth = ctx.measureText(upperText).width;
        lineHeight = fontSize * 1.2;
        textHeight = lineHeight * Math.ceil(textWidth / (canvasSize - 2 * padding));
    }

    const maxTextWidth = canvasSize - 2 * padding;

    // Check if the text fits in one line
    if (textWidth <= maxTextWidth) {
        ctx.strokeText(upperText, canvasSize / 2, canvasSize / 2); // Draw outline
        ctx.fillText(upperText, canvasSize / 2, canvasSize / 2); // Draw text
    } else {
        wrapText(ctx, upperText, canvasSize / 2, padding + lineHeight / 2, maxTextWidth, lineHeight);
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

    const upperText = text.toUpperCase();

    const canvasSize = 800;
    const padding = 20;
    const encoder = new GIFEncoder(canvasSize, canvasSize);
    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
    encoder.setDelay(500); // frame delay in ms
    encoder.setQuality(10); // image quality. 10 is default.

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // Function to draw text
    function drawText(color) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000'; // Black outline
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Determine the maximum font size that fits the canvas width and height
        let fontSize = 300; // Start with a larger font size
        ctx.font = `${fontSize}px "Montserrat"`;
        let textWidth = ctx.measureText(upperText).width;
        let lineHeight = fontSize * 1.2;
        let textHeight = lineHeight;

        while ((textWidth > canvasSize - 2 * padding || textHeight > canvasSize - 2 * padding) && fontSize > 10) {
            fontSize--;
            ctx.font = `${fontSize}px "Montserrat"`;
            textWidth = ctx.measureText(upperText).width;
            lineHeight = fontSize * 1.2;
            textHeight = lineHeight * Math.ceil(textWidth / (canvasSize - 2 * padding));
        }

        const maxTextWidth = canvasSize - 2 * padding;

        // Check if the text fits in one line
        if (textWidth <= maxTextWidth) {
            ctx.strokeText(upperText, canvasSize / 2, canvasSize / 2); // Draw outline
            ctx.fillText(upperText, canvasSize / 2, canvasSize / 2); // Draw text
        } else {
            wrapText(ctx, upperText, canvasSize / 2, padding + lineHeight / 2, maxTextWidth, lineHeight);
        }
    }

    const colors = ['#FF0000', '#00FF00', '#0000FF']; // Red, Green, Blue

    for (let i = 0; i < colors.length; i++) {
        drawText(colors[i]);
        encoder.addFrame(ctx);
    }

    encoder.finish();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
        
