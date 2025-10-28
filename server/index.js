// ===============================================
// BoardTranscription Backend
// Node.js + Express + Whisper Integration (Full Version)
// ===============================================

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");
const WebSocket = require("ws");
const PDFDocument = require("pdfkit");
const fontkit = require("@foliojs-fork/fontkit");
const { Document, Packer, Paragraph, AlignmentType } = require("docx");

const app = express();

// ==================================================
// Express Setup
// ==================================================
app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "50mb", type: "application/json; charset=utf-8" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    next();
});

// ==================================================
// Folder Setup
// ==================================================
const uploadDir = path.join(__dirname, "uploads");
const transcriptDir = path.join(__dirname, "transcripts");
const fontDir = path.join(__dirname, "fonts");
[uploadDir, transcriptDir, fontDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
const fontPath = path.join(fontDir, "NotoSansHebrew-VariableFont_wdth,wght.ttf");

// ==================================================
// Serve Uploads & Transcripts
// ==================================================
app.get("/uploads/:file", (req, res) => {
  try {
    const decoded = decodeURIComponent(req.params.file);
    const fullPath = path.join(uploadDir, decoded);
    if (!fs.existsSync(fullPath)) return res.status(404).send("File not found");

    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = { ".wav": "audio/wav", ".mp3": "audio/mpeg", ".webm": "audio/webm", ".mp4": "video/mp4" };
    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
    res.setHeader("Accept-Ranges", "bytes");
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    console.error("❌ Error serving upload:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/transcripts/:file", (req, res) => {
  try {
    const decoded = decodeURIComponent(req.params.file);
    const fullPath = path.join(transcriptDir, decoded);
    if (!fs.existsSync(fullPath)) return res.status(404).send("File not found");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.sendFile(fullPath);
  } catch (err) {
    console.error("❌ Error serving transcript:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ==================================================
// PDF & DOCX Download Routes
// ==================================================
app.get("/api/download-pdf/:file", (req, res) => {
  try {
    const decoded = decodeURIComponent(req.params.file);
    const safeName = decoded.replace(/[:<>:"/\\|?*\x00-\x1F]/g, "_");
    const txtPath = path.join(transcriptDir, `${safeName}.txt`);
    if (!fs.existsSync(txtPath)) return res.status(404).send("Transcript not found");

    const text = fs.readFileSync(txtPath, "utf8");
    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont("NotoSansHebrew", fontPath);
    doc.font("NotoSansHebrew");

    const openInline = req.query.open === "true";
    const encodedName = encodeURIComponent(`${safeName}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${openInline ? "inline" : "attachment"}; filename*=UTF-8''${encodedName}`);

    doc.pipe(res);
    doc.fontSize(14).text(text, { align: "right" });
    doc.end();
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
    res.status(500).send("Error generating PDF");
  }
});

app.get("/api/download-docx/:file", async (req, res) => {
  try {
    const decoded = decodeURIComponent(req.params.file);
    const safeName = decoded.replace(/[:<>:"/\\|?*\x00-\x1F]/g, "_");
    const txtPath = path.join(transcriptDir, `${safeName}.txt`);
    if (!fs.existsSync(txtPath)) return res.status(404).send("Transcript not found");

    const text = fs.readFileSync(txtPath, "utf8");
    const doc = new Document({
      sections: [
        {
          properties: { rightToLeft: true },
          children: [new Paragraph({ text, alignment: AlignmentType.RIGHT })],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const utf8Name = encodeURIComponent(`${safeName}.docx`);
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${utf8Name}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(buffer);
  } catch (err) {
    console.error("❌ Error generating DOCX:", err);
    res.status(500).send("Error generating DOCX");
  }
});

// ==================================================
// Multer Storage
// ==================================================
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    try {
      const decodedName = Buffer.from(file.originalname || "", "latin1").toString("utf8")
        .replace(/[:<>:"/\\|?*\x00-\x1F]/g, "_");
      const base = path.parse(decodedName).name;
      const ext = path.extname(decodedName) || ".wav";
      cb(null, `${base}_${Date.now()}${ext}`);
    } catch {
      cb(null, "file_" + Date.now() + ".wav");
    }
  },
});
const upload = multer({ storage });

// ==================================================
// Whisper Runner + Helpers
// ==================================================
function ensureWavFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".wav") return filePath;
  const wavPath = filePath.replace(ext, ".wav");
  try {
    execSync(`"C:\\Users\\gilsh\\ffmpeg-2025-10-19-git-dc39a576ad-essentials_build\\ffmpeg-2025-10-19-git-dc39a576ad-essentials_build\\bin\\ffmpeg.exe" -y -i "${filePath}" -ar 16000 -ac 1 "${wavPath}"`);
    return wavPath;
  } catch {
    return filePath;
  }
}

function runWhisper(audioPath, transcriptPath, label) {
  const pythonCmd = "C:\\Users\\gilsh\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe";
  const wavFile = ensureWavFormat(audioPath);
  const py = spawn(pythonCmd, ["transcribe_local.py", wavFile, transcriptPath], { env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  py.stdout.on("data", (d) => console.log(`[PY ${label}] ${d.toString("utf8")}`));
  py.stderr.on("data", (d) => console.error(`[PY ERR ${label}] ${d.toString("utf8")}`));
  return new Promise((resolve) => {
    py.on("close", (code) => resolve(code === 0 && fs.existsSync(transcriptPath)));
  });
}

// ==================================================
// API: Upload Audio
// ==================================================
app.post("/api/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });
    const savedName = req.file.filename;
    const baseName = path.parse(savedName).name;
    const targetPath = path.join(uploadDir, savedName);
    const transcriptPath = path.join(transcriptDir, `${baseName}.txt`);

    const title = req.body.topic?.trim() || "דיון ללא שם";
    const leader = req.body.leaderName?.trim() || "לא צוין";

    console.log(`[UPLOAD] ${savedName} | ${title} | ${leader}`);
    const success = await runWhisper(targetPath, transcriptPath, "UPLOAD");
    if (!success) return res.status(500).json({ status: "error", message: "Whisper failed" });

    fs.writeFileSync(
      path.join(transcriptDir, `${baseName}.json`),
      JSON.stringify({ title, leader, created: new Date().toISOString() }, null, 2),
      "utf8"
    );
    const text = fs.readFileSync(transcriptPath, "utf8");
    res.json({ status: "ok", filename: baseName, title, leader, transcriptPreview: text.slice(0, 300) + "..." });
  } catch (err) {
    console.error("❌ Error in /api/upload-audio:", err);
    res.status(500).json({ status: "error", message: "Internal error" });
  }
});

// ==================================================
// Other Modes: Recording, Supervised, Live
// ==================================================
app.post("/api/transcribe/recording", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const file = req.file.filename, base = path.parse(file).name;
  const audio = path.join(uploadDir, file), txt = path.join(transcriptDir, `${base}.txt`);
  const success = await runWhisper(audio, txt, "RECORDING");
  if (!success) return res.status(500).json({ status: "error" });
  res.json({ status: "ok", mode: "recording", file: base, transcriptPreview: fs.readFileSync(txt, "utf8").slice(0, 300) + "..." });
});

app.post("/api/transcribe/supervised", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const file = req.file.filename, base = path.parse(file).name;
  const audio = path.join(uploadDir, file), txt = path.join(transcriptDir, `${base}.txt`);
  const success = await runWhisper(audio, txt, "SUPERVISED");
  if (!success) return res.status(500).json({ status: "error" });
  res.json({ status: "ok", mode: "supervised", transcriptPreview: fs.readFileSync(txt, "utf8").slice(0, 300) + "..." });
});

// ==================================================
// WebSocket (Live)
const WS_PORT = 8080;
const wss = new WebSocket.Server({ port: WS_PORT });
wss.on("connection", (ws) => {
  console.log("[WS] Client connected");
  const chunks = [];
  ws.on("message", async (msg) => {
    if (msg.toString() === "end") {
      const ts = Date.now(), base = `live_${ts}`;
      const audio = path.join(uploadDir, `${base}.wav`), txt = path.join(transcriptDir, `${base}.txt`);
      fs.writeFileSync(audio, Buffer.concat(chunks));
      const ok = await runWhisper(audio, txt, "LIVE");
      ws.send(JSON.stringify(ok ? { status: "ok", transcript: fs.readFileSync(txt, "utf8") } : { status: "error" }));
    } else chunks.push(Buffer.from(msg));
  });
});

// ==================================================
// List + Details
// ==================================================
app.get("/api/list-recordings", (_, res) => {
  try {
    const files = fs.readdirSync(uploadDir)
      .filter(f => /\.(wav|mp3|webm|mp4)$/.test(f))
      .map(f => {
        const base = f.replace(/\.(wav|mp3|webm|mp4)$/, "");
        const transcript = path.join(transcriptDir, `${base}.txt`);
        const metaFile = path.join(transcriptDir, `${base}.json`);
        const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : {};
        return {
          filename: base,
          title: meta.title || base,
          leader: meta.leader || "לא צוין",
          status: fs.existsSync(transcript) ? "ready" : "processing",
        };
      });
    res.json({ status: "ok", recordings: files });
  } catch (err) {
    console.error("❌ list-recordings:", err);
    res.status(500).json({ status: "error" });
  }
});

app.get("/api/discussion-details/:filename", (req, res) => {
  try {
    // 🟢 שם גולמי מה-URL
    const rawName = req.params.filename;
    const decodedName = decodeURIComponent(rawName);

    // 🟢 מנקה תווים אסורים בלבד (לא נוגעת בעברית או ב-%)
    const safeName = decodedName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

    const audioExtensions = [".wav", ".webm", ".mp3", ".mp4"];
    let audioPath = null;
    let transcriptPath = null;

    // ✅ חיפוש מדורג: קודם השם המדויק, אחר כך גרסאות נקיות
    for (const ext of audioExtensions) {
      const variants = [
        path.join(uploadDir, `${rawName}${ext}`),
        path.join(uploadDir, `${decodedName}${ext}`),
        path.join(uploadDir, `${safeName}${ext}`),
        path.join(uploadDir, `${safeName.replace(/[:%3A]/g, "_")}${ext}`),
      ];
      for (const test of variants) {
        if (fs.existsSync(test)) {
          audioPath = test;
          break;
        }
      }
      if (audioPath) break;
    }

    const txtVariants = [
      path.join(transcriptDir, `${rawName}.txt`),
      path.join(transcriptDir, `${decodedName}.txt`),
      path.join(transcriptDir, `${safeName}.txt`),
      path.join(transcriptDir, `${safeName.replace(/[:%3A]/g, "_")}.txt`),
    ];
    for (const t of txtVariants) {
      if (fs.existsSync(t)) {
        transcriptPath = t;
        break;
      }
    }

    // ✅ חיפוש JSON (metadata)
    const metaVariants = [
      path.join(transcriptDir, `${rawName}.json`),
      path.join(transcriptDir, `${decodedName}.json`),
      path.join(transcriptDir, `${safeName}.json`),
      path.join(transcriptDir, `${safeName.replace(/[:%3A]/g, "_")}.json`),
    ];
    const metaFile = metaVariants.find(fs.existsSync);
    let title = safeName;
    let leader = "לא צוין";

    if (metaFile) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
        title = meta.title || title;
        leader = meta.leader || leader;
      } catch (e) {
        console.warn("⚠️ שגיאה בקריאת metadata:", e.message);
      }
    }

    // 🔍 בקרה
    if (!audioPath) console.warn(`❌ לא נמצא קובץ שמע עבור ${safeName}`);
    if (!transcriptPath) console.warn(`❌ לא נמצא תמלול עבור ${safeName}`);

    // ✅ החזרת פרטים ל-Frontend
    res.json({
      filename: safeName,
      title,
      leader,
      hasAudio: !!audioPath,
      hasTranscript: !!transcriptPath,
      transcriptPreview: transcriptPath
        ? fs.readFileSync(transcriptPath, "utf8").slice(0, 300)
        : "",
      date: audioPath ? new Date(fs.statSync(audioPath).mtime).toLocaleString("he-IL") : null,
      status: transcriptPath ? "ready" : "processing",
    });
  } catch (err) {
    console.error("❌ שגיאה ב-/api/discussion-details:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// ==================================================
const PORT = 3000;
app.listen(PORT, () => console.log(`HTTP server running on ${PORT} | WS on ${WS_PORT}`));
