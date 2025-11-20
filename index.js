const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const GIFEncoder = require('gifencoder');

const app = express();
const PORT = process.env.PORT || 3000;

registerFont(path.join(__dirname, 'fonts', 'Montserrat-BlackItalic.ttf'), { family: 'Montserrat' });
registerFont(path.join(__dirname, 'fonts', 'arialnarrow.ttf'), { family: 'ArialNarrow' });
registerFont(path.join(__dirname, 'fonts', 'NotoColorEmoji.ttf'), { family: 'Noto Color Emoji' });

function fitTextToCanvasAdvanced(ctx, text, canvasWidth, padding, initialFontSize, fontFamily) {
    let fontSize = initialFontSize;
    let lines = [];
    const minFontSize = 10;
    const lineHeightFactor = 1.2;

    function getLinesForSize(currentFontSize) {
        // Font Stack yang Diperbaiki: Tambahkan 'sans-serif'
        ctx.font = `${currentFontSize}px "${fontFamily}", sans-serif, "Noto Color Emoji"`; 
        const words = text.split(' ');
        let currentLines = [];
        let currentLine = '';

        words.forEach((word) => {
            let testLine = currentLine + (currentLine ? ' ' : '') + word;
            let textWidth = ctx.measureText(testLine).width;

            if (textWidth > canvasWidth - (2 * padding)) {
                if (currentLine) {
                    currentLines.push(currentLine);
                }
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) currentLines.push(currentLine);
        return currentLines;
    }

    while (fontSize > minFontSize) {
        lines = getLinesForSize(fontSize);
        const totalHeight = lines.length * (fontSize * lineHeightFactor);

        let maxWidthExceeded = false;
        for (const line of lines) {
            if (ctx.measureText(line).width > canvasWidth - (2 * padding)) {
                maxWidthExceeded = true;
                break;
            }
        }

        if (!maxWidthExceeded && totalHeight <= canvasWidth - (2 * padding)) {
            break;
        }
        fontSize--;
    }

    return { lines, fontSize };
}

app.get('/text-to-picture', (req, res) => {
    const { text, format = 'png' } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasSize = 800;
    const padding = 40;
    const fontFamily = 'Montserrat';
    const initialFontSize = 100;

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 15;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const { lines, fontSize } = fitTextToCanvasAdvanced(ctx, text, canvasSize, padding, initialFontSize, fontFamily);
    
    ctx.font = `${fontSize}px "${fontFamily}", sans-serif, "Noto Color Emoji"`;

    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    
    const startY = (canvasSize - totalTextHeight) / 2 + (lineHeight / 2);

    const angle = -0.2;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    lines.forEach((line, index) => {
        const y = startY + index * lineHeight;

        ctx.strokeText(line, canvas.width / 2, y);

        ctx.fillText(line, canvas.width / 2, y);
    });

    ctx.restore();

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

    const canvasSize = 500;
    const padding = 50;
    const initialFontSize = 100;
    const fontFamily = 'Montserrat';

    const encoder = new GIFEncoder(canvasSize, canvasSize);

    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(100);
    encoder.setQuality(20);

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    const { lines: textLines, fontSize } = fitTextToCanvasAdvanced(ctx, text, canvasSize, padding, initialFontSize, fontFamily);
    
    const lineHeight = fontSize * 1.2;
    const totalHeight = textLines.length * lineHeight;
    const startY = (canvasSize - totalHeight) / 2 + (lineHeight / 2);

    const colors = ['#a7a7e7', '#a7c7e7', '#a7e7e7'];
    const totalFrames = 30;
    const bounceHeight = 50;

    function drawText(ctx, color, yOffset, linesToDraw, currentFontSize, currentStartY, currentLineHeight) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 15;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = `${currentFontSize}px "${fontFamily}", sans-serif, "Noto Color Emoji"`;

        linesToDraw.forEach((line, index) => {
            const y = currentStartY + index * currentLineHeight + yOffset;
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillText(line, canvas.width / 2, y);
        });
    }

    for (let i = 0; i < totalFrames; i++) {
        const progress = i / totalFrames;
        const bounce = Math.sin(progress * Math.PI * 2) * bounceHeight * 0.5;
        const color = colors[Math.floor(i / 3) % colors.length];

        drawText(ctx, color, bounce, textLines, fontSize, startY, lineHeight);
        encoder.addFrame(ctx);
    }

    encoder.finish();
});

app.get('/brat', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const outputCanvasSize = 500;
    const lowResCanvasSize = 200;
    const margin = 5;
    const initialFontSize = 40;
    const fontFamily = 'Arial';

    const lowResCanvas = createCanvas(lowResCanvasSize, lowResCanvasSize);
    const lowResCtx = lowResCanvas.getContext('2d');

    lowResCtx.fillStyle = '#FFFFFF';
    lowResCtx.fillRect(0, 0, lowResCanvasSize, lowResCanvasSize);

    const { lines, fontSize } = fitTextToCanvasAdvanced(lowResCtx, text, lowResCanvasSize, margin, initialFontSize, fontFamily);
    
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    
    const startY = (lowResCanvasSize - totalTextHeight) / 2 + (lineHeight / 2);

    lowResCtx.fillStyle = '#000000';
    lowResCtx.font = `bold ${fontSize}px "${fontFamily}", sans-serif, "Noto Color Emoji"`;
    lowResCtx.textAlign = 'left';
    lowResCtx.textBaseline = 'middle';
    
    lowResCtx.filter = "blur(1px)";

    lines.forEach((l, index) => {
        const y = startY + index * lineHeight;
        lowResCtx.fillText(l, margin, y);
    });
    

    const outputCanvas = createCanvas(outputCanvasSize, outputCanvasSize);
    const outputCtx = outputCanvas.getContext('2d');

    outputCtx.imageSmoothingEnabled = false;
    outputCtx.drawImage(lowResCanvas, 0, 0, outputCanvasSize, outputCanvasSize);
    
    res.setHeader('Content-Type', 'image/png');
    res.send(outputCanvas.toBuffer());
});


app.get('/bratvid', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const outputCanvasSize = 500;
    const lowResCanvasSize = 200;
    const margin = 5;
    const initialFontSize = 40;
    const fontFamily = 'Arial';

    const encoder = new GIFEncoder(outputCanvasSize, outputCanvasSize);
    const lowResCanvas = createCanvas(lowResCanvasSize, lowResCanvasSize);
    const lowResCtx = lowResCanvas.getContext('2d');
    
    const outputCanvas = createCanvas(outputCanvasSize, outputCanvasSize);
    const outputCtx = outputCanvas.getContext('2d');

    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(300);
    encoder.setQuality(30);

    const { lines: staticLines, fontSize } = fitTextToCanvasAdvanced(lowResCtx, text, lowResCanvasSize, margin, initialFontSize, fontFamily);
    
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = staticLines.length * lineHeight;
    const startY = (lowResCanvasSize - totalTextHeight) / 2 + (lineHeight / 2);

    let allWords = text.split(' ');
    let maxFrames = allWords.length;

    function splitWordsToLines(wordsToRender, currentFontSize, canvasWidth, currentMargin, ctxInstance) {
        ctxInstance.font = `bold ${currentFontSize}px "${fontFamily}", sans-serif, "Noto Color Emoji"`;
        let lines = [];
        let currentLine = '';

        wordsToRender.forEach((word) => {
            let testLine = currentLine + (currentLine ? ' ' : '') + word;
            let textWidth = ctxInstance.measureText(testLine).width;

            if (textWidth > canvasWidth - (2 * currentMargin)) {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
    }


    for (let i = 0; i < maxFrames; i++) {
        const wordsToRender = allWords.slice(0, i + 1);
        
        const linesToRender = splitWordsToLines(wordsToRender, fontSize, lowResCanvasSize, margin, lowResCtx);
        
        lowResCtx.fillStyle = '#FFFFFF';
        lowResCtx.fillRect(0, 0, lowResCanvasSize, lowResCanvasSize);

        lowResCtx.fillStyle = '#000000';
        lowResCtx.font = `bold ${fontSize}px "${fontFamily}", sans-serif, "Noto Color Emoji"`;
        lowResCtx.textAlign = 'left';
        lowResCtx.textBaseline = 'middle';
        
        lowResCtx.filter = "blur(1px)";

        linesToRender.forEach((l, index) => {
            const y_pos = startY + index * lineHeight;
            lowResCtx.fillText(l, margin, y_pos);
        });
        

        outputCtx.fillStyle = '#FFFFFF';
        outputCtx.fillRect(0, 0, outputCanvasSize, outputCanvasSize);
        outputCtx.imageSmoothingEnabled = false;
        outputCtx.drawImage(lowResCanvas, 0, 0, outputCanvasSize, outputCanvasSize);

        encoder.addFrame(outputCtx);
    }

    encoder.finish();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
