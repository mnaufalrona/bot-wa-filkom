const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const express = require("express");

// --- Web server keep-alive ---
const app = express();
app.get("/", (req, res) => res.send("🚀 Bot WhatsApp aktif di Railway!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server aktif di port ${PORT}`));

// --- Load JSON data ---
let jadwal = {};
try {
    jadwal = JSON.parse(fs.readFileSync("jadwal.json", "utf-8"));
} catch (err) {
    console.error("❌ Gagal membaca jadwal.json:", err.message);
}

let dosen = [];
try {
    dosen = JSON.parse(fs.readFileSync("dosen.json", "utf-8"));
} catch (err) {
    console.error("❌ Gagal membaca dosen.json:", err.message);
}

// --- Quotes ---
const quotes = [
    "Jangan menyerah, awal yang sulit akan indah pada akhirnya.",
    "Sukses adalah hasil dari usaha kecil yang diulang setiap hari.",
    "Tetap semangat! Setiap hari adalah peluang baru.",
    "Belajar dari kemarin, hidup untuk hari ini, berharap untuk besok."
];

// --- WhatsApp Client ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
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
        ]
    }
});

client.on("qr", qr => {
    qrcode.generate(qr, { small: true });
    console.log("📱 Scan QR ini dengan WhatsApp kamu!");
});

client.on("ready", () => {
    console.log("✅ Bot siap digunakan!");
});

// --- Pesan masuk ---
client.on("message", async message => {
    const msg = message.body.trim();
    if (!msg.startsWith("!")) return;

    const lowerMsg = msg.toLowerCase();

    // !dosen
    if (lowerMsg === "!dosen") {
        if (!dosen || dosen.length === 0) return message.reply("⚠️ Data dosen belum tersedia.");
        let text = "👨‍🏫 *Daftar Nomor Dosen:*\n───────────────────────\n";
        dosen.forEach(d => {
            let noHp = d.no !== "none" ? d.no : "❌ Tidak tersedia";
            text += `📌 ${d.nama} (${d.matkul}) : ${noHp}\n`;
        });
        text += "───────────────────────";
        return message.reply(text);
    }

    // !help
    if (lowerMsg === "!help") {
        return message.reply(
            "✨ *DAFTAR PERINTAH BOT FILKOM 2025* ✨\n" +
            "───────────────────────\n" +
            "📅 *!jadwal* → Lihat jadwal kegiatan\n" +
            "📚 *!matkul* → Lihat gambar matkul\n" +
            "👨‍🏫 *!dosen* → Lihat nomor dosen\n" +
            "💡 *!quote* → Dapatkan motivasi\n" +
            "❓ *!help* → Lihat daftar perintah\n" +
            "───────────────────────\n" +
            "⚡ Bot WhatsApp siap membantu!"
        );
    }

    // !jadwal
    if (lowerMsg === "!jadwal") {
        if (!jadwal || Object.keys(jadwal).length === 0) return message.reply("⚠️ Jadwal belum tersedia.");
        let text = "📅 *Jadwal Kuliah Mingguan*\n\n";
        for (let hari in jadwal) {
            text += `📌 *${hari.charAt(0).toUpperCase() + hari.slice(1)}*\n`;
            jadwal[hari].split("&").forEach(mk => text += `- ${mk.trim()}\n`);
            text += "\n";
        }
        return message.reply(text.trim());
    }

    // !matkul
    if (lowerMsg === "!matkul") {
        try {
            const media = MessageMedia.fromFilePath("./jadwal.png");
            await client.sendMessage(message.from, media, { caption: "📚 Jadwal Mata Kuliah Semester 5" });
        } catch (err) {
            console.error("❌ Gagal kirim foto matkul:", err.message);
            return message.reply("⚠️ Foto `jadwal.png` tidak ditemukan.");
        }
    }

    // !quote
    if (lowerMsg === "!quote") {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        return message.reply("💡 " + randomQuote);
    }
});

client.initialize();
