const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const express = require("express");
const path = require("path");

// ===== WEB SERVER KEEP-ALIVE =====
const app = express();
app.get("/", (req, res) => res.send("🚀 Bot WhatsApp aktif dengan Express!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server aktif di port ${PORT}`));

// ===== HANDLER ERROR GLOBAL =====
process.on("uncaughtException", err => console.error("❌ Uncaught Exception:", err));
process.on("unhandledRejection", (reason, promise) =>
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason)
);

// ===== LOAD DATA =====
let jadwal = {};
let dosen = [];

try {
    const jadwalPath = path.join(__dirname, "jadwal.json");
    if (fs.existsSync(jadwalPath)) jadwal = JSON.parse(fs.readFileSync(jadwalPath, "utf-8"));
    else console.warn("⚠️ File jadwal.json tidak ditemukan.");
} catch (err) {
    console.error("❌ Gagal membaca jadwal.json:", err.message);
}

try {
    const dosenPath = path.join(__dirname, "dosen.json");
    if (fs.existsSync(dosenPath)) dosen = JSON.parse(fs.readFileSync(dosenPath, "utf-8"));
    else console.warn("⚠️ File dosen.json tidak ditemukan.");
} catch (err) {
    console.error("❌ Gagal membaca dosen.json:", err.message);
}

// ===== QUOTES =====
const quotes = [
    "Jangan menyerah, awal yang sulit akan indah pada akhirnya.",
    "Sukses adalah hasil dari usaha kecil yang diulang setiap hari.",
    "Tetap semangat! Setiap hari adalah peluang baru.",
    "Belajar dari kemarin, hidup untuk hari ini, berharap untuk besok.",
];

// ===== INISIALISASI WHATSAPP BOT =====
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: process.env.CHROME_PATH || "/usr/bin/chromium-browser",
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--single-process",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--user-data-dir=/tmp/chrome-user-data"
        ],
    },
});

client.on("qr", qr => {
    qrcode.generate(qr, { small: true });
    console.log("📱 Scan QR ini dengan WhatsApp kamu!");
});

client.on("ready", () => console.log("✅ Bot siap digunakan!"));

// ===== EVENT MESSAGE =====
client.on("message", async message => {
    try {
        const msg = message.body.trim();
        if (!msg.startsWith("!")) return;
        const lowerMsg = msg.toLowerCase();

        if (lowerMsg === "!dosen") {
            if (!dosen.length) return message.reply("⚠️ Data dosen belum tersedia.");
            let text = "👨‍🏫 *Daftar Nomor Dosen:*\n───────────────────────\n";
            dosen.forEach(d => {
                const noHp = d.no !== "none" ? d.no : "❌ Tidak tersedia";
                text += `📌 ${d.nama} (${d.matkul}) : ${noHp}\n`;
            });
            text += "───────────────────────";
            return message.reply(text);
        }

        if (lowerMsg === "!help") {
            return message.reply(
                "✨ *DAFTAR PERINTAH BOT FILKOM 2025* ✨\n───────────────────────\n" +
                "📅 *!jadwal* → Lihat jadwal kegiatan\n" +
                "📚 *!matkul* → Lihat gambar matkul\n" +
                "👨‍🏫 *!dosen* → Lihat nomor dosen\n" +
                "💡 *!quote* → Dapatkan motivasi\n" +
                "❓ *!help* → Lihat daftar perintah\n───────────────────────\n⚡ Bot WhatsApp siap membantu!"
            );
        }

        if (lowerMsg === "!jadwal") {
            if (!Object.keys(jadwal).length) return message.reply("⚠️ Jadwal belum tersedia.");
            let text = "📅 *Jadwal Kuliah Mingguan*\n\n";
            for (let hari in jadwal) {
                text += `📌 *${hari.charAt(0).toUpperCase() + hari.slice(1)}*\n`;
                jadwal[hari].split("&").forEach(mk => text += `- ${mk.trim()}\n`);
                text += "\n";
            }
            return message.reply(text.trim());
        }

        if (lowerMsg === "!matkul") {
            const mediaPath = path.join(__dirname, "jadwal.png");
            if (!fs.existsSync(mediaPath)) return message.reply("⚠️ Foto `jadwal.png` tidak ditemukan.");
            const media = MessageMedia.fromFilePath(mediaPath);
            await client.sendMessage(message.from, media, { caption: "📚 Jadwal Mata Kuliah Semester 5" });
        }

        if (lowerMsg === "!quote") {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            return message.reply("💡 " + randomQuote);
        }
    } catch (err) {
        console.error("❌ Error saat memproses pesan:", err.message);
    }
});

// ===== START BOT =====
client.initialize();
