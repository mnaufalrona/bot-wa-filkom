const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const express = require("express");

// ===== WEB SERVER KEEP-ALIVE =====
const app = express();
app.get("/", (req, res) => {
    res.send("🚀 Bot WhatsApp aktif dengan Express!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server aktif di port ${PORT}`));

// ===== LOAD DATA =====
let jadwal = {};
let dosen = [];
try {
    jadwal = JSON.parse(fs.readFileSync("jadwal.json", "utf-8"));
} catch (err) {
    console.error("❌ Gagal membaca jadwal.json:", err.message);
}
try {
    dosen = JSON.parse(fs.readFileSync("dosen.json", "utf-8"));
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
        executablePath:
            process.env.CHROME_PATH ||
            "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--user-data-dir=/tmp/chrome-user-data",
            "--disable-extensions",
            "--disable-plugins",
            "--disable-web-security",
        ],
    },
});

client.on("qr", qr => {
    qrcode.generate(qr, { small: true });
    console.log("📱 Scan QR ini dengan WhatsApp kamu!");
});

client.on("ready", () => console.log("✅ Bot siap digunakan!"));

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== EVENT MESSAGE =====
client.on("message", async message => {
    console.log(`📩 Dari: ${message.from} | Isi: ${message.body} | fromMe: ${message.fromMe}`);

    const msg = message.body.trim();
    if (!msg.startsWith("!")) return;
    const lowerMsg = msg.toLowerCase();

    if (lowerMsg === "!dosen") {
        if (!dosen.length) return message.reply("⚠️ Data dosen belum tersedia.");
        let text = "👨‍🏫 *Daftar Nomor Dosen:*\n───────────────────────\n";
        dosen.forEach(d => {
            let noHp = d.no !== "none" ? d.no : "❌ Tidak tersedia";
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
        try {
            const media = MessageMedia.fromFilePath("./jadwal.png");
            await client.sendMessage(message.from, media, { caption: "📚 Jadwal Mata Kuliah Semester 5" });
        } catch (err) {
            console.error("❌ Gagal kirim foto matkul:", err.message);
            return message.reply("⚠️ Foto `jadwal.png` tidak ditemukan. Pastikan file ada di folder bot.");
        }
    }

    if (lowerMsg === "!quote") {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        return message.reply("💡 " + randomQuote);
    }
});

// ===== START BOT =====
client.initialize();
