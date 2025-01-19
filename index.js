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
    const canvasSize = 1000; // Ukuran kanvas besar untuk kualitas lebih baik
    const padding = 50;
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // Bersihkan latar belakang
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gaya teks
    ctx.fillStyle = '#FFFFFF'; // Warna teks putih
    ctx.strokeStyle = '#000000'; // Outline hitam
    ctx.lineWidth = 25; // Ketebalan outline
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Menentukan ukuran font
    let fontSize = 300;
    ctx.font = `${fontSize}px "Montserrat"`;
    let textWidth = ctx.measureText(upperText).width;

    while (textWidth > canvasSize - 2 * padding && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Montserrat"`;
        textWidth = ctx.measureText(upperText).width;
    }

    // Atur rotasi teks (opsional)
    const rotationAngle = -5 * (Math.PI / 180); // Rotasi -5 derajat
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotationAngle);

    // Gambar teks dengan outline
    ctx.strokeText(upperText, 0, 0); // Garis tepi
    ctx.fillText(upperText, 0, 0);   // Isi teks

    // Reset rotasi
    ctx.rotate(-rotationAngle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Konversi ke buffer gambar
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
    const canvasSize = 500; // Ukuran kanvas
    const padding = 50;
    const encoder = new GIFEncoder(canvasSize, canvasSize);

    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0); // 0 untuk pengulangan tak terbatas
    encoder.setDelay(50); // Delay per frame (50ms)
    encoder.setQuality(20); // Kualitas gambar
    encoder.setTransparent(0x00FF00); // Warna transparansi (green screen-like)

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // Warna pastel
    const colors = ['#add8e6', '#ffc0cb', '#dda0dd']; // Biru, pink, ungu

    // Jumlah frame dan animasi memantul
    const totalFrames = 20; // Total frame
    const bounceHeight = 100; // Tinggi pantulan
    const baseY = canvasSize / 2;

    // Fungsi untuk menggambar teks
    function drawText(ctx, color, yOffset) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Bersihkan kanvas (transparan)

        // Gaya teks
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000'; // Outline hitam
        ctx.lineWidth = 25; // Ketebalan outline
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Menentukan ukuran font
        let fontSize = 300;
        ctx.font = `${fontSize}px "Montserrat"`;
        let textWidth = ctx.measureText(upperText).width;

        while (textWidth > canvasSize - 2 * padding && fontSize > 10) {
            fontSize--;
            ctx.font = `${fontSize}px "Montserrat"`;
            textWidth = ctx.measureText(upperText).width;
        }

        // Posisi teks
        ctx.strokeText(upperText, canvas.width / 2, baseY + yOffset);
        ctx.fillText(upperText, canvas.width / 2, baseY + yOffset);
    }

    // Generate frame animasi
    for (let i = 0; i < totalFrames; i++) {
        const progress = i / totalFrames;
        const bounce = Math.sin(progress * Math.PI * 2) * bounceHeight; // Gerakan memantul
        const color = colors[i % colors.length]; // Warna berganti setiap frame

        drawText(ctx, color, bounce);
        encoder.addFrame(ctx);
    }

    encoder.finish();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
