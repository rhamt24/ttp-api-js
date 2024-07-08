const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { cwebp } = require('webp-converter');

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
        ctx.strokeText(text, canvasSize / 2, canvasSize / 2); // Draw outline
        ctx.fillText(text, canvasSize / 2, canvasSize / 2); // Draw text
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

app.get('/animated-text-to-webp', async (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasSize = 800;
    const frameCount = 30; // Number of frames
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // Function to draw text
    function drawText(color) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000'; // Black outline
        ctx.lineWidth = 4;
        ctx.font = 'bold 70pt Roboto';
        ctx.textAlign = 'center';
        ctx.strokeText(text, canvas.width / 2, canvas.height / 2); // Draw outline
        ctx.fillText(text, canvas.width / 2, canvas.height / 2); // Draw text
    }

    // Colors to cycle through
    const colors = ['#FF0000', '#00FF00', '#0000FF']; // Red, Green, Blue

    // Create frames
    const frameFiles = [];
    for (let i = 0; i < frameCount; i++) {
        drawText(colors[i % colors.length]);
        const framePath = path.join(__dirname, `frame-${i}.png`);
        frameFiles.push(framePath);
        fs.writeFileSync(framePath, canvas.toBuffer('image/png'));
    }

    const webpFilePath = path.join(__dirname, 'animated-text.webp');

    // Convert frames to animated WebP
    const generateWebP = async (inputFiles, outputFile) => {
        const options = `-q 80 -d 100`; // Quality and delay
        return new Promise((resolve, reject) => {
            cwebp(inputFiles.join(' '), outputFile, options, (status, error) => {
                if (status === '100') {
                    resolve(outputFile);
                } else {
                    reject(error);
                }
            });
        });
    };

    generateWebP(frameFiles, webpFilePath)
        .then(() => {
            res.setHeader('Content-Type', 'image/webp');
            res.sendFile(webpFilePath, () => {
                // Cleanup temporary frame files
                frameFiles.forEach(file => fs.unlinkSync(file));
                fs.unlinkSync(webpFilePath);
            });
        })
        .catch(error => {
            console.error(`Error converting to WebP: ${error}`);
            return res.status(500).json({ error: 'Error creating WebP animation' });
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
