const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const GIFEncoder = require('gifencoder');

const app = express();
const PORT = process.env.PORT || 3000;

// Register fonts
// Pastikan font ini tersedia di folder 'fonts' Anda.
// Jika Anda ingin dukungan emoji yang lebih universal, pastikan font di sistem server
// Anda dapat menanganinya, atau gunakan font yang mendukung Unicode penuh (misalnya, Noto Color Emoji, jika diinstal).
// Untuk tujuan ini, kita akan mengandalkan 'Arial' sebagai fallback umum.
registerFont(path.join(__dirname, 'fonts', 'Montserrat-BlackItalic.ttf'), { family: 'Montserrat' });
registerFont(path.join(__dirname, 'fonts', 'arialnarrow.ttf'), { family: 'ArialNarrow' });

// --- UTILITY FUNCTION FOR TEXT SPLITTING AND SIZING ---

// Fungsi utilitas untuk membagi teks menjadi baris yang pas di kanvas
// dan menyesuaikan ukuran font secara dinamis.
function fitTextToCanvas(ctx, text, canvasSize, margin, initialFontSize, lineHeightFactor) {
    let fontSize = initialFontSize;
    let lines = [];
    let lineSpacing = 10; // Spasi tambahan antar baris

    // Proses teks untuk mendapatkan baris yang sesuai
    function getLines(currentFontSize) {
        ctx.font = `bold ${currentFontSize}px Arial`;
        const words = text.split(' ');
        let currentLines = [];
        let currentLine = '';

        words.forEach((word) => {
            let testLine = currentLine + (currentLine ? ' ' : '') + word;
            let textWidth = ctx.measureText(testLine).width;

            if (textWidth > canvasSize - 2 * margin) {
                // Baris terlalu panjang, pindahkan ke baris baru
                if (currentLine) { // Pastikan currentLine tidak kosong
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

    // Loop untuk mengecilkan font sampai teks muat
    while (fontSize > 10) {
        lines = getLines(fontSize);

        // Hitung tinggi total yang dibutuhkan
        const lineMetrics = fontSize * lineHeightFactor; // Tinggi baris adalah faktor dari fontSize
        const totalHeight = lines.length * lineMetrics + (lines.length - 1) * lineSpacing;

        // Cek apakah tinggi dan lebar sudah pas
        if (totalHeight <= canvasSize - 2 * margin) {
            break; // Teks sudah muat
        }

        fontSize -= 2; // Kurangi ukuran font
        if (fontSize <= 10) {
            // Jika font terlalu kecil, gunakan font terkecil yang masih memungkinkan
            lines = getLines(10);
            fontSize = 10;
            break;
        }
    }

    return { lines, fontSize };
}

// --- END OF UTILITY FUNCTION ---


/**
 * Static Text-to-Picture (TTP) - Dipertahankan seperti aslinya
 */
app.get('/text-to-picture', (req, res) => {
    // ... (Logika TTP statis Anda dipertahankan, karena bukan fokus perbaikan 'Brat') ...
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
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 15;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let fontSize = 300;
    ctx.font = `${fontSize}px "Montserrat"`;

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

    // Adjust font size if the text is too wide
    let splitText = splitTextDynamically(ctx, text, canvasSize, padding);
    let totalHeight = splitText.length * lineHeight;

    while (totalHeight > canvasSize - 2 * padding && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Montserrat"`;
        splitText = splitTextDynamically(ctx, text, canvasSize, padding);
        totalHeight = splitText.length * lineHeight;
    }
    
    // Ulangi penyesuaian font setelah split
    while (ctx.measureText(splitText[0] || '').width > canvasSize - 2 * padding && fontSize > 10) {
        fontSize--;
        ctx.font = `${fontSize}px "Montserrat"`;
        splitText = splitTextDynamically(ctx, text, canvasSize, padding);
    }
    
    // Hitung ulang totalHeight dan startY
    totalHeight = splitText.length * (fontSize + 10);
    const startY = (canvasSize - totalHeight) / 2 + (fontSize + 10) / 2;

    // Apply rotation for slanted text
    const angle = -0.2;
    ctx.save(); // Simpan kondisi kanvas sebelum rotasi
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw each line with outline and fill
    splitText.forEach((line, index) => {
        // Ganti 'lineHeight' dengan perhitungan yang lebih dinamis
        const y = (canvasSize / 2) + (index - (splitText.length - 1) / 2) * (fontSize + 10);

        // Draw outline (stroke) first
        ctx.strokeText(line, canvas.width / 2, y);

        // Draw text fill
        ctx.fillText(line, canvas.width / 2, y);
    });
    
    ctx.restore(); // Kembalikan kondisi kanvas

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
 * Disesuaikan untuk menggunakan fungsi utilitas fitTextToCanvas
 */
app.get('/animated-text-to-picture', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasSize = 500;
    const margin = 50; // Padding yang digunakan untuk perhitungan
    const lineHeightFactor = 1.2; // Faktor tinggi baris relatif terhadap ukuran font
    const initialFontSize = 100;

    const encoder = new GIFEncoder(canvasSize, canvasSize);

    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0); // Loop the GIF
    encoder.setDelay(100); // Delay per frame
    encoder.setQuality(20); // Quality of the GIF

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // **Gunakan fungsi utilitas untuk mendapatkan ukuran font dan baris yang pas**
    const { lines: textLines, fontSize } = fitTextToCanvas(ctx, text, canvasSize, margin, initialFontSize, lineHeightFactor);
    
    // Perhitungan metrik berdasarkan hasil penyesuaian
    const lineMetrics = fontSize * lineHeightFactor;
    const lineSpacing = 10;
    const totalHeight = textLines.length * lineMetrics + (textLines.length - 1) * lineSpacing;
    const startY = (canvasSize - totalHeight) / 2 + lineMetrics / 2;


    const colors = ['#a7a7e7', '#a7c7e7', '#a7e7e7'];
    const totalFrames = 30;
    const bounceHeight = 50;

    function drawText(ctx, color, yOffset, textLines, fontSize, startY, lineMetrics, lineSpacing) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 15; // Disesuaikan sedikit lebih tipis dari 25 untuk ukuran 500x500
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = `${fontSize}px "Montserrat"`;

        textLines.forEach((line, index) => {
            // Hitung posisi Y baru
            const y = startY + index * (lineMetrics + lineSpacing) + yOffset;
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillText(line, canvas.width / 2, y);
        });
    }

    for (let i = 0; i < totalFrames; i++) {
        const progress = i / totalFrames;
        const bounce = Math.sin(progress * Math.PI * 2) * bounceHeight * 0.5; // Mengurangi ketinggian pantulan
        const color = colors[Math.floor(i / 3) % colors.length];

        drawText(ctx, color, bounce, textLines, fontSize, startY, lineMetrics, lineSpacing);
        encoder.addFrame(ctx);
    }

    encoder.finish();
});

/**
 * Static Text-to-Picture (brat) - Teks Otomatis Menyesuaikan Ukuran & Lebih Burik
 * **TELAH DIPERBAIKI**
 */
app.get('/brat', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasSize = 500;
    const margin = 20; // Margin baru
    const initialFontSize = 140;
    const lineHeightFactor = 1.1; // Faktor tinggi baris untuk Arial

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Dapatkan baris dan ukuran font yang sudah disesuaikan
    const { lines, fontSize } = fitTextToCanvas(ctx, text, canvasSize, margin, initialFontSize, lineHeightFactor);
    
    // Perhitungan metrik berdasarkan hasil penyesuaian
    const lineMetrics = fontSize * lineHeightFactor;
    const lineSpacing = 10;
    const totalHeight = lines.length * lineMetrics + (lines.length - 1) * lineSpacing;
    
    // Hitung posisi Y awal agar teks berada di tengah vertikal
    let startY = (canvasSize - totalHeight) / 2 + lineMetrics * 0.8; // Penyesuaian ke tengah

    // Aplikasikan filter
    ctx.filter = "blur(80px) contrast(150%) brightness(110%)";

    ctx.fillStyle = '#000000';
    ctx.font = `bold ${fontSize}px Arial`;

    lines.forEach((l, index) => {
        // Posisi X tetap 15 (margin kiri)
        const y = startY + index * (lineMetrics + lineSpacing);
        ctx.fillText(l, 15, y);
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer());
});


/**
 * Animated Text-to-GIF (bratvid) - Teks Otomatis Menyesuaikan Ukuran & Burik
 * **TELAH DIPERBAIKI**
 */
app.get('/bratvid', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const canvasSize = 500;
    const margin = 20;
    const initialFontSize = 140;
    const lineHeightFactor = 1.1;

    const encoder = new GIFEncoder(canvasSize, canvasSize);
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    res.setHeader('Content-Type', 'image/gif');
    encoder.createReadStream().pipe(res);

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(300);
    encoder.setQuality(30);

    // **Gunakan fungsi utilitas untuk mendapatkan ukuran font dan baris yang pas**
    const { lines: staticLines, fontSize } = fitTextToCanvas(ctx, text, canvasSize, margin, initialFontSize, lineHeightFactor);
    
    // Perhitungan metrik berdasarkan hasil penyesuaian
    const lineMetrics = fontSize * lineHeightFactor;
    const lineSpacing = 10;
    const totalHeight = staticLines.length * lineMetrics + (staticLines.length - 1) * lineSpacing;
    const startY = (canvasSize - totalHeight) / 2 + lineMetrics * 0.8;

    // Pisahkan semua kata dalam format animasi per kata
    let allWords = text.split(' ');
    let maxFrames = allWords.length;

    // Fungsi untuk memecah array kata menjadi baris berdasarkan lebar
    function splitWordsToLines(wordsToRender, currentFontSize, canvasSize, margin, ctx) {
        ctx.font = `bold ${currentFontSize}px Arial`;
        let lines = [];
        let currentLine = '';

        wordsToRender.forEach((word) => {
            let testLine = currentLine + (currentLine ? ' ' : '') + word;
            let textWidth = ctx.measureText(testLine).width;

            if (textWidth > canvasSize - 2 * margin) {
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
        // Dapatkan hanya kata-kata yang akan di-render di frame ini
        const wordsToRender = allWords.slice(0, i + 1);
        
        // Pecah kata-kata ini menjadi baris
        const linesToRender = splitWordsToLines(wordsToRender, fontSize, canvasSize, margin, ctx);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        ctx.filter = "blur(80px) contrast(150%) brightness(110%)";

        ctx.fillStyle = '#000000';
        ctx.font = `bold ${fontSize}px Arial`;

        let y = startY;
        
        linesToRender.forEach((l, index) => {
            const y_pos = startY + index * (lineMetrics + lineSpacing);
            ctx.fillText(l, 15, y_pos);
        });

        encoder.addFrame(ctx);
    }

    encoder.finish();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
