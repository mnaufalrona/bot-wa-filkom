const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("🚀 WhatsApp Bot sedang berjalan!");
});

// Gunakan port dari Replit / default 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server aktif di http://localhost:${PORT}`);
});
