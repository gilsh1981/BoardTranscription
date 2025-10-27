// ===============================================
// BoardTranscription Backend
// Node.js + Express + Whisper Integration
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
const { Document, Packer, Paragraph, AlignmentType, TextRun } = require("docx");

const app = express();

// ✅ תמיכה מלאה בעברית/אנגלית (קידוד UTF-8)
app.use(
  cors({
    origin: "http://localhost:3001", // מאפשר גישה ל-React
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

// -------------------------------
// Folder Setup (Cross-platform) — תמיכה מלאה בעברית
// -------------------------------
const uploadDir = path.join(__dirname, "uploads");
const transcriptDir = path.join(__dirname, "transcripts");
const fontDir = path.join(__dirname, "fonts");

[uploadDir, transcriptDir, fontDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const fontPath = path.join(__dirname, "fonts", "NotoSansHebrew-VariableFont_wdth,wght.ttf");

// ⚠️ אל תשתמש ב-static – הוא שובר שמות בעברית
// במקום זאת – נשתמש בנתיבים מפורשים עם decodeURIComponent
// ✅ הצגת קובץ שמע עם סוג MIME מתאים (audio/wav וכו')
app.get("/uploads/:file", (req, res) => {
  try {
    const decoded = decodeURIComponent(req.params.file);
    const fullPath = path.join(uploadDir, decoded);
    if (!fs.existsSync(fullPath)) return res.status(404).send("File not found");

    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      ".wav": "audio/wav",
      ".mp3": "audio/mpeg",
      ".webm": "audio/webm",
      ".mp4": "video/mp4",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";

    // ✅ שליחה ב-stream כדי שהדפדפן יזהה קובץ אודיו כ-Binary
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Accept-Ranges", "bytes");
    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  } catch (err) {
    console.error("❌ Error serving upload:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ הצגת תמלול כטקסט רגיל (UTF-8)
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
// 🧾 הורדת תמלול כ-PDF או Word
// ==================================================

// ✅ PDF — תומך בעברית + פתיחה או הורדה
app.get("/api/download-pdf/:file", (req, res) => {
  try {
    const decoded = decodeURIComponent(req.params.file);
    const txtPath = path.join(transcriptDir, `${decoded}.txt`);
    if (!fs.existsSync(txtPath)) return res.status(404).send("Transcript not found");

    const text = fs.readFileSync(txtPath, "utf8");
    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont("NotoSansHebrew", fontPath);
    doc.font("NotoSansHebrew");

    // ✅ בודק אם רוצים הורדה או פתיחה ישירה
    const openInline = req.query.open === "true"; // ?open=true → פתיחה
    const safeName = encodeURIComponent(`${decoded}.pdf`);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${openInline ? "inline" : "attachment"}; filename*=UTF-8''${safeName}`
    );

    doc.pipe(res);
    doc.fontSize(14).text(text, { align: "right" });
    doc.end();
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
    res.status(500).send("Error generating PDF");
  }
});

// -------------------------------
// Root route
// -------------------------------
app.get("/", (req, res) => {
  res.send("✅ BoardTranscription backend running — live, recording, and supervised modes ready");
});

// ==================================================
// Multer config — תמיכה מלאה בעברית בשמות קבצים
// ==================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    try {
      let decodedName = Buffer.from(file.originalname || "", "latin1").toString("utf8");
      decodedName = decodedName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

      const base = path.parse(decodedName).name;
      const ext = path.extname(decodedName) || ".wav";
      const finalName = `${base}_${Date.now()}${ext}`;

      cb(null, finalName);
    } catch (e) {
      console.error("❌ Filename decode error:", e);
      cb(null, "file_" + Date.now() + ".wav");
    }
  },
});
const upload = multer({ storage });

// ==================================================
// Helper: Convert to WAV if needed (ffmpeg)
// ==================================================
function ensureWavFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".wav") return filePath;

  const wavPath = filePath.replace(ext, ".wav");
  try {
    console.log(`[CONVERT] ${filePath} → ${wavPath}`);
    execSync(
      `"C:\\Users\\gilsh\\ffmpeg-2025-10-19-git-dc39a576ad-essentials_build\\ffmpeg-2025-10-19-git-dc39a576ad-essentials_build\\bin\\ffmpeg.exe" -y -i "${filePath}" -ar 16000 -ac 1 "${wavPath}"`
    );
    return wavPath;
  } catch (err) {
    console.error(`[ERROR] Failed to convert ${filePath} to WAV:`, err);
    return filePath;
  }
}

// ==================================================
// Helper: run Whisper Python script
// ==================================================
function runWhisper(audioPath, transcriptPath, label) {
  const pythonCmd = "C:\\Users\\gilsh\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe";
  const wavFile = ensureWavFormat(audioPath);

  console.log(`[${label}] Spawning Whisper for ${wavFile}`);

  const py = spawn(pythonCmd, ["transcribe_local.py", wavFile, transcriptPath], {
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });

  py.stdout.on("data", (d) => console.log(`[PY ${label}] ${d.toString("utf8")}`));
  py.stderr.on("data", (d) => console.error(`[PY ERR ${label}] ${d.toString("utf8")}`));

  return new Promise((resolve) => {
    py.on("close", (code) => {
      if (code !== 0) {
        console.error(`❌ [${label}] Whisper failed with exit code ${code}`);
        return resolve(false);
      }
      const ok = fs.existsSync(transcriptPath);
      if (ok)
        console.log(`🟢 [${label}] Whisper completed successfully: ${path.basename(transcriptPath)}`);
      resolve(ok);
    });
  });
}

// ==================================================
// Helper: clean filename (תומך גם בעברית)
// ==================================================
function cleanFilename(name) {
  return decodeURIComponent(name)
    .replace(/\.(webm|wav|mp3|mp4|m4a)$/i, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}

// ==================================================
// 1️⃣ RECORDING MODE
// ==================================================
app.post("/api/transcribe/recording", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  console.log(`[RECORDING] Saved: ${savedName}`);
  const success = await runWhisper(targetPath, transcriptPath, "RECORDING");

  if (!success)
    return res.status(500).json({ status: "error", message: "Whisper failed" });

  const text = fs.readFileSync(transcriptPath, "utf8");
  res.json({
    status: "ok",
    mode: "recording",
    file: baseName,
    transcriptPreview: text.slice(0, 300) + "...",
  });
});

// ==================================================
// 2️⃣ SUPERVISED MODE
// ==================================================
app.post("/api/transcribe/supervised", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const savedName = req.file.filename;
  const target = path.join(uploadDir, savedName);
  const baseName = path.parse(savedName).name;
  const transcriptFile = path.join(transcriptDir, `${baseName}.txt`);

  console.log(`[SUPERVISED] File received: ${savedName}`);

  const success = await runWhisper(target, transcriptFile, "SUPERVISED");

  if (!success)
    return res.status(500).json({ status: "error", message: "Whisper failed" });

  const text = fs.readFileSync(transcriptFile, "utf8");
  res.json({
    status: "ok",
    mode: "supervised",
    transcriptPreview: text.slice(0, 300) + "...",
  });
});

// ==================================================
// 3️⃣ LIVE MODE (WebSocket)
// ==================================================
const WS_PORT = 8080;
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`[WS] Live WebSocket ready at ws://localhost:${WS_PORT}`);

wss.on("connection", (ws) => {
  console.log("[WS] Client connected");
  const chunks = [];

  ws.on("message", async (msg) => {
    if (msg.toString() === "end") {
      const timestamp = Date.now();
      const baseName = `live_${timestamp}`;
      const audioFile = path.join(uploadDir, `${baseName}.wav`);
      const transcriptFile = path.join(transcriptDir, `${baseName}.txt`);

      fs.writeFileSync(audioFile, Buffer.concat(chunks));
      console.log(`[WS] Stream saved: ${audioFile}`);

      const success = await runWhisper(audioFile, transcriptFile, "LIVE");

      if (success) {
        const text = fs.readFileSync(transcriptFile, "utf8");
        ws.send(JSON.stringify({ status: "ok", mode: "live", transcript: text }));
      } else {
        ws.send(JSON.stringify({ status: "error", message: "Transcription failed" }));
      }
    } else {
      chunks.push(Buffer.from(msg));
    }
  });

  ws.on("close", () => console.log("[WS] Client disconnected"));
});

// ==================================================
// Fetch transcript endpoint
// ==================================================
app.get("/api/transcript/:filename", (req, res) => {
  const cleanName = cleanFilename(req.params.filename);
  const file = path.join(transcriptDir, `${cleanName}.txt`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Transcript not found" });
  const text = fs.readFileSync(file, "utf8");
  res.json({ status: "ok", transcript: text });
});

/// ==================================================
// ==================================================
// 4️⃣ API לקבלת הקלטה מהקליינט (frontend React)
// ==================================================
app.post("/api/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });

    const savedName = req.file.filename;
    const baseName = path.parse(savedName).name;
    const targetPath = path.join(uploadDir, savedName);
    const transcriptPath = path.join(transcriptDir, `${baseName}.txt`);

    // 🟢 שליפה של הנתונים מה-Frontend (NewDiscussionSetup)
    const discussionTitle = req.body.topic?.trim() || "דיון ללא שם";
    const leaderName = req.body.leaderName?.trim() || "לא צוין";

    console.log(`[UPLOAD-AUDIO] קובץ: ${savedName} | נושא: ${discussionTitle} | מוביל: ${leaderName}`);

    // 🎧 הרצת Whisper
    const success = await runWhisper(targetPath, transcriptPath, "UPLOAD");
    if (!success) {
      return res.status(500).json({ status: "error", message: "Whisper transcription failed" });
    }

    const text = fs.readFileSync(transcriptPath, "utf8");

    // 🧾 שמירת מטא-מידע על הדיון
    const metaPath = path.join(transcriptDir, `${baseName}.json`);
    fs.writeFileSync(
      metaPath,
      JSON.stringify(
        {
          title: discussionTitle,
          leader: leaderName,
          created: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf8"
    );

    res.json({
      status: "ok",
      filename: baseName,
      title: discussionTitle,
      leader: leaderName,
      transcriptPreview: text.slice(0, 300) + "...",
    });
  } catch (err) {
    console.error("❌ Error in /api/upload-audio:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// ==================================================
// 5️⃣ Polling API
// ==================================================
app.get("/api/check-transcript", (req, res) => {
  const file = req.query.file ? cleanFilename(req.query.file) : "";
  if (!file) {
    return res.status(400).json({ status: "error", message: "Missing ?file=" });
  }

  const transcriptPath = path.join(transcriptDir, `${file}.txt`);
  if (fs.existsSync(transcriptPath)) {
    res.json({ status: "ready" });
  } else {
    res.json({ status: "processing" });
  }
});

// ==================================================
// 6️⃣ API – רשימת תמלולים
// ==================================================
app.get("/api/list-transcripts", (req, res) => {
  try {
    const ready = fs
      .readdirSync(transcriptDir)
      .filter((f) => f.endsWith(".txt"))
      .map((f) => ({
        filename: f.replace(".txt", ""),
        sizeKB: Math.round(fs.statSync(path.join(transcriptDir, f)).size / 1024),
        modified: new Date(fs.statSync(path.join(transcriptDir, f)).mtime).toLocaleString("he-IL"),
        status: "ready",
      }));

    const processing = fs
      .readdirSync(uploadDir)
      .filter(
        (f) =>
          (f.endsWith(".wav") ||
            f.endsWith(".mp3") ||
            f.endsWith(".mp4") ||
            f.endsWith(".webm")) &&
          !ready.find((r) => r.filename === f.replace(/\.(wav|mp3|mp4|webm)$/, ""))
      )
      .map((f) => ({
        filename: f.replace(/\.(wav|mp3|mp4|webm)$/, ""),
        sizeKB: Math.round(fs.statSync(path.join(uploadDir, f)).size / 1024),
        modified: new Date(fs.statSync(path.join(uploadDir, f)).mtime).toLocaleString("he-IL"),
        status: "processing",
      }));

    const merged = [...ready, ...processing];
    const unique = merged.filter(
      (item, index, self) => index === self.findIndex((t) => t.filename === item.filename)
    );

    res.json({ status: "ok", transcripts: unique });
  } catch (err) {
    console.error("❌ Error listing transcripts:", err);
    res.status(500).json({ status: "error", message: "Failed to list transcripts" });
  }
});

// ==================================================
// ==================================================
// 7️⃣ API – רשימת הקלטות ל־Dashboard (עם שם דיון ומוביל אמיתיים)
// ==================================================
app.get("/api/list-recordings", (req, res) => {
  try {
    const files = fs
      .readdirSync(uploadDir)
      .filter(
        (f) =>
          f.endsWith(".wav") || f.endsWith(".webm") || f.endsWith(".mp3") || f.endsWith(".mp4")
      )
      .map((f) => {
        const base = f.replace(/\.(wav|webm|mp3|mp4)$/, "");
        const transcriptFile = path.join(transcriptDir, `${base}.txt`);
        const metaFile = path.join(transcriptDir, `${base}.json`);
        const exists = fs.existsSync(transcriptFile);
        const stats = fs.statSync(path.join(uploadDir, f));

        // 🧾 קריאת מידע מה-json אם קיים
        let title = decodeURIComponent(base);
        let leader = "לא צוין";

        if (fs.existsSync(metaFile)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
            title = meta.title || title;
            leader = meta.leader || leader;
          } catch (err) {
            console.error(`⚠️ שגיאה בקריאת metadata של ${base}:`, err);
          }
        }

        let transcriptPreview = "";
        if (exists) {
          try {
            transcriptPreview = fs
              .readFileSync(transcriptFile, "utf8")
              .replace(/\r?\n+/g, " ")
              .slice(0, 200);
          } catch (err) {
            console.error(`❌ שגיאה בקריאת תמלול של ${base}:`, err);
          }
        }

        return {
          filename: base,
          title,
          leader,
          file: f,
          date: new Date(stats.mtime).toLocaleDateString("he-IL"),
          sizeKB: (stats.size / 1024).toFixed(1),
          status: exists ? "ready" : "processing",
          transcriptPreview,
        };
      });

    const uniqueFiles = files.filter(
      (item, index, self) => index === self.findIndex((t) => t.filename === item.filename)
    );

    res.json({ status: "ok", recordings: uniqueFiles });
  } catch (err) {
    console.error("❌ שגיאה בטעינת ההקלטות:", err);
    res.status(500).json({ status: "error", message: "כשל בטעינת ההקלטות" });
  }
});

// ==================================================
// ==================================================
// 8️⃣ API – פרטי הקלטה בודדת (תמיכה בעברית ותווים מיוחדים)
// ==================================================
app.get("/api/discussion-details/:filename", (req, res) => {
  const rawName = req.params.filename;
  const decodedName = decodeURIComponent(rawName);
  const safeName = decodedName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

  const audioExtensions = [".wav", ".webm", ".mp3", ".mp4"];
  const possibleAudioPaths = [];

  for (const ext of audioExtensions) {
    possibleAudioPaths.push(path.join(uploadDir, `${rawName}${ext}`));
    possibleAudioPaths.push(path.join(uploadDir, `${decodedName}${ext}`));
    possibleAudioPaths.push(path.join(uploadDir, `${safeName}${ext}`));
  }

  let audioPath = null;
  for (const test of possibleAudioPaths) {
    if (fs.existsSync(test)) {
      audioPath = test;
      break;
    }
  }

  const transcriptPaths = [
    path.join(transcriptDir, `${rawName}.txt`),
    path.join(transcriptDir, `${decodedName}.txt`),
    path.join(transcriptDir, `${safeName}.txt`),
  ];
  let transcriptPath = transcriptPaths.find(fs.existsSync);

  if (!audioPath) {
    console.error(`❌ קובץ שמע לא נמצא עבור ${safeName}`);
  }
  if (!transcriptPath) {
    console.error(`❌ Transcript not found: ${safeName}`);
  }

  res.json({
    filename: safeName,
    hasAudio: !!audioPath,
    hasTranscript: !!transcriptPath,
    transcriptPreview: transcriptPath
      ? fs.readFileSync(transcriptPath, "utf8").slice(0, 300)
      : "",
    date: audioPath ? new Date(fs.statSync(audioPath).mtime).toLocaleString("he-IL") : null,
    status: transcriptPath ? "ready" : "processing",
  });
});

// ==================================================
// HTTP Server start
// ==================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`HTTP server running on port ${PORT} | WebSocket on ${WS_PORT}`)
);
// -------------------------------

// -------------------------------
// DOCX Download Route (Hebrew Filename Safe RFC5987)
// -------------------------------
app.get("/api/download-docx/:file", async (req, res) => {
  try {
    // 🟢 Decode Hebrew safely
    const decoded = decodeURIComponent(req.params.file);
    const txtPath = path.join(transcriptDir, `${decoded}.txt`);

    if (!fs.existsSync(txtPath)) {
      console.error("❌ Transcript not found:", txtPath);
      return res.status(404).send("Transcript not found");
    }

    const text = fs.readFileSync(txtPath, "utf8");

    // 🟢 Generate DOCX
    const doc = new Document({
      sections: [
        {
          properties: { rightToLeft: true },
          children: [
            new Paragraph({
              text,
              alignment: AlignmentType.RIGHT,
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    // ✅ Encode Hebrew filename for HTTP header (RFC5987)
    const utf8Name = encodeURIComponent(`${decoded}.docx`);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${utf8Name}`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.send(buffer);
  } catch (err) {
    console.error("❌ Error generating DOCX:", err);
    res.status(500).send("Error generating DOCX");
  }
});
