const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");

// Import server Express (biar Replit kasih URL)
require("./server.js");

// Load jadwal dari file JSON
let jadwal = {};
try {
    jadwal = JSON.parse(fs.readFileSync("jadwal.json", "utf-8"));
} catch (err) {
    console.error("❌ Gagal membaca jadwal.json:", err.message);
}

// Load dosen dari file JSON
let dosen = [];
try {
    dosen = JSON.parse(fs.readFileSync("dosen.json", "utf-8"));
} catch (err) {
    console.error("❌ Gagal membaca dosen.json:", err.message);
}

// Daftar quote
const quotes = [
    "Jangan menyerah, awal yang sulit akan indah pada akhirnya.",
    "Sukses adalah hasil dari usaha kecil yang diulang setiap hari.",
    "Tetap semangat! Setiap hari adalah peluang baru.",
    "Belajar dari kemarin, hidup untuk hari ini, berharap untuk besok.",
];

// Inisialisasi client
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

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("📱 Scan QR ini dengan WhatsApp kamu!");
});

client.on("ready", () => {
    console.log("✅ Bot siap digunakan!");
});

// Fungsi delay (kalau butuh jeda)
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Event untuk pesan dari user/grup
client.on("message", async (message) => {
    console.log(
        `📩 Dari: ${message.from} | Isi: ${message.body} | fromMe: ${message.fromMe}`,
    );

    const msg = message.body.trim();
    if (!msg.startsWith("!")) return;

    const lowerMsg = msg.toLowerCase();

    // !dosen
    if (lowerMsg === "!dosen") {
        if (!dosen || dosen.length === 0) {
            return message.reply("⚠️ Data dosen belum tersedia.");
        }

        let text = "👨‍🏫 *Daftar Nomor Dosen:*\n";
        text += "───────────────────────\n";
        dosen.forEach((d) => {
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
                "⚡ Bot WhatsApp siap membantu!",
        );
    }

    // !jadwal
    if (lowerMsg === "!jadwal") {
        if (!jadwal || Object.keys(jadwal).length === 0) {
            return message.reply("⚠️ Jadwal belum tersedia.");
        }

        let text = "📅 *Jadwal Kuliah Mingguan*\n\n";
        for (let hari in jadwal) {
            text += `📌 *${hari.charAt(0).toUpperCase() + hari.slice(1)}*\n`;

            let matkulList = jadwal[hari].split("&");
            matkulList.forEach((mk) => {
                text += `- ${mk.trim()}\n`;
            });

            text += "\n";
        }

        return message.reply(text.trim());
    }

    // !matkul
    if (lowerMsg === "!matkul") {
        try {
            const media = MessageMedia.fromFilePath("./jadwal.png");
            await client.sendMessage(message.from, media, {
                caption: "📚 Jadwal Mata Kuliah Semester 5",
            });
        } catch (err) {
            console.error("❌ Gagal kirim foto matkul:", err.message);
            return message.reply(
                "⚠️ Foto `jadwal.png` tidak ditemukan. Pastikan file ada di folder bot.",
            );
        }
    }

    // !quote
    if (lowerMsg === "!quote") {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        return message.reply("💡 " + randomQuote);
    }
});

client.initialize();
