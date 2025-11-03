// ===============================================
// BoardTranscription Backend
// Node.js + Express + Whisper Integration (Final Full Version)
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
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require("docx");
// ==========================

// 🟦 צבעים לקונסול
const colors = {
  reset: "\x1b[0m",
  purple: "\x1b[35m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};


// Logger (Console + File)
// ==========================
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, "server.log");

const logToFile = (msg) => {
  fs.appendFileSync(logFile, msg + "\n", "utf8");
};

const log = (color, label, msg) => {
  const now = new Date().toLocaleString("he-IL");
  const formatted = `[${label}] ${now} | ${msg}`;
  console.log(`${color}${formatted}${colors.reset}`);
  logToFile(formatted);
};


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
// Static File Serving
// ==================================================
app.use("/uploads", express.static(uploadDir));
app.use("/transcripts", express.static(transcriptDir));

// ==================================================
// Serve Uploads & Transcripts
// ==================================================
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
// PDF Download Route
// ==================================================
app.get("/api/download-pdf/:file", (req, res) => {
  try {
    const rawName = req.params.file.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
    const matchFile = fs
      .readdirSync(transcriptDir)
      .find((f) => f.startsWith(rawName) && f.endsWith(".txt"));
    if (!matchFile) return res.status(404).send("Transcript not found");

    const txtPath = path.join(transcriptDir, matchFile);
    console.log(`[PDF DOWNLOAD] Using: ${txtPath}`);

    const text = fs.readFileSync(txtPath, "utf8");
    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont("NotoSansHebrew", fontPath);
    doc.font("NotoSansHebrew");

    const encodedName = encodeURIComponent(`${rawName}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodedName}`
    );

    doc.pipe(res);
    doc.fontSize(14).text(text, { align: "right" });
    doc.end();
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
    res.status(500).send("Error generating PDF");
  }
});

// ==================================================
// DOCX Download Route
// ==================================================
app.get("/api/download-docx/:file", async (req, res) => {
  try {
    const rawName = req.params.file.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
    const matchFile = fs
      .readdirSync(transcriptDir)
      .find((f) => f.startsWith(rawName) && f.endsWith(".txt"));
    if (!matchFile) return res.status(404).send("Transcript not found");

    const transcriptPath = path.join(transcriptDir, matchFile);
    console.log(`[DOCX DOWNLOAD] Using: ${transcriptPath}`);

    const content = fs.readFileSync(transcriptPath, "utf8");
    const doc = new Document({
      sections: [
        {
          properties: { rightToLeft: true },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: content,
                  font: "Arial",
                  size: 24,
                  rightToLeft: true,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const encodedName = encodeURIComponent(`${rawName}.docx`);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodedName}`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.send(buffer);
  } catch (err) {
    console.error("[DOCX DOWNLOAD ERROR]", err);
    res.status(500).send("Error generating DOCX file");
  }
});

// ==================================================
// Multer Storage
// ==================================================
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    try {
      const decodedName = Buffer.from(file.originalname || "", "latin1")
        .toString("utf8")
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
    execSync(
      `"C:\\Users\\gilsh\\ffmpeg-2025-10-19-git-dc39a576ad-essentials_build\\ffmpeg-2025-10-19-git-dc39a576ad-essentials_build\\bin\\ffmpeg.exe" -y -i "${filePath}" -ar 16000 -ac 1 "${wavPath}"`
    );
    return wavPath;
  } catch {
    return filePath;
  }
}

function runWhisper(audioPath, transcriptPath, label) {
  const pythonCmd =
    "C:\\Users\\gilsh\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe";
  const wavFile = ensureWavFormat(audioPath);
  const py = spawn(pythonCmd, ["transcribe_local.py", wavFile, transcriptPath], {
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
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
    if (!success)
      return res.status(500).json({ status: "error", message: "Whisper failed" });
     // === צור גרסאות PDF ו-DOCX אוטומטית ===
try {
  const txtContent = fs.readFileSync(transcriptPath, "utf8");

  // PDF
  const pdfDoc = new PDFDocument({ margin: 50 });
  pdfDoc.registerFont("NotoSansHebrew", fontPath);
  pdfDoc.font("NotoSansHebrew");
  const pdfPath = path.join(transcriptDir, `${baseName}.pdf`);
  const pdfStream = fs.createWriteStream(pdfPath);
  pdfDoc.pipe(pdfStream);
  pdfDoc.fontSize(14).text(txtContent, { align: "right" });
  pdfDoc.end();

  // DOCX
  const wordDoc = new Document({
    sections: [
      {
        properties: { rightToLeft: true },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: txtContent,
                font: "Arial",
                size: 24,
                rightToLeft: true,
              }),
            ],
          }),
        ],
      },
    ],
  });
  const docxBuffer = await Packer.toBuffer(wordDoc);
  fs.writeFileSync(path.join(transcriptDir, `${baseName}.docx`), docxBuffer);

  console.log(`🟢 Created PDF & DOCX for ${baseName}`);
} catch (err) {
  console.error("❌ Error creating PDF/DOCX automatically:", err);
}
// זיהוי סוג הדיון לפי מקור הבקשה
let type = "uploaded"; // ברירת מחדל
if (req.body?.source === "recorded") type = "recorded";
if (req.body?.source === "dictated") type = "dictated";

fs.writeFileSync(
  path.join(transcriptDir, `${baseName}.json`),
  JSON.stringify({ title, leader, type, created: new Date().toISOString() }, null, 2),
  "utf8"
);
    const text = fs.readFileSync(transcriptPath, "utf8");
    res.json({
      status: "ok",
      filename: baseName,
      title,
      leader,
      transcriptPreview: text.slice(0, 300) + "...",
    });
  } catch (err) {
    console.error("❌ Error in /api/upload-audio:", err);
    res.status(500).json({ status: "error", message: "Internal error" });
  }
});

  // ==================================================
  // API: Save Initial / Final Transcript + Upload Final
  // ==================================================
   app.post("/api/save-transcript", (req, res) => {
  try {
    const filename = req.body?.filename;
    const content = req.body?.content;
    if (!filename || !content) {
      console.warn("⚠️ Missing filename or content in request body (/api/save-transcript)");
      return res.json({ status: "skip", message: "No data provided" });
    }

    const filePath = path.join(transcriptDir, `${filename}.txt`);
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[SAVE INITIAL] Updated ${filePath}`);

    const metaPath = path.join(transcriptDir, `${filename}.json`);
    let meta = {};
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    } else {
      // 🔸 אם אין JSON, ניצור חדש — סוג הדיון Dictated
      meta = {
        title: filename,
        leader: "לא צוין",
        type: "dictated",
        created: new Date().toISOString(),
      };
    }
    meta.lastEdited = new Date().toISOString();
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");

    res.json({ status: "ok", message: "Transcript saved" });
  } catch (err) {
    console.error("❌ Error saving transcript:", err);
    res.status(500).json({ status: "error" });
  }
});


    app.post("/api/save-final-transcript", (req, res) => {
    try {
    const filename = req.body?.filename;
    const content = req.body?.content;
    if  (!filename || !content) {
    console.warn("⚠️ Missing filename or content in request body (/api/save-final-transcript)");
    return res.json({ status: "skip", message: "No data provided" });
    }

    if (!filename || !content)
      return res.status(400).json({ status: "error", message: "Missing data" });

    const finalPath = path.join(transcriptDir, `${filename}_final.txt`);
    fs.writeFileSync(finalPath, content, "utf8");
    console.log(`[SAVE FINAL] Created ${finalPath}`);

    const metaPath = path.join(transcriptDir, `${filename}.json`);
    let meta = {};
    if (fs.existsSync(metaPath))
      meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    meta.finalTranscript = `${filename}_final.txt`;
    meta.finalSaved = new Date().toISOString();
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");

    res.json({ status: "ok", message: "Final transcript saved" });
  } catch (err) {
    console.error("❌ Error saving final transcript:", err);
    res.status(500).json({ status: "error" });
  }
});

const uploadFinal = multer({ dest: path.join(transcriptDir, "temp") });
app.post(
  "/api/upload-final-transcript",
  uploadFinal.single("finalTranscript"),
  (req, res) => {
    try {
      const filename = req.body.filename;
      if (!req.file || !filename)
        return res.status(400).json({ status: "error", message: "Missing file or name" });

      const finalPath = path.join(
        transcriptDir,
        `${filename}_final${path.extname(req.file.originalname)}`
      );
      fs.renameSync(req.file.path, finalPath);

      console.log(`[UPLOAD FINAL] ${finalPath}`);

      const metaPath = path.join(transcriptDir, `${filename}.json`);
      let meta = {};
      if (fs.existsSync(metaPath))
        meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      meta.finalTranscript = path.basename(finalPath);
      meta.finalUploaded = new Date().toISOString();
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");

      res.json({ status: "ok", message: "Final transcript uploaded" });
    } catch (err) {
      console.error("❌ Error uploading final transcript:", err);
      res.status(500).json({ status: "error" });
    }
  }
);

// ==================================================
// WebSocket + Discussion Listing
// ==================================================
const WS_PORT = 8080;
const wss = new WebSocket.Server({ port: WS_PORT });
wss.on("connection", (ws) => {
  console.log("[WS] Client connected");
  const chunks = [];
  ws.on("message", async (msg) => {
    if (msg.toString() === "end") {
      const ts = Date.now(),
        base = `live_${ts}`;
      const audio = path.join(uploadDir, `${base}.wav`),
        txt = path.join(transcriptDir, `${base}.txt`);
      fs.writeFileSync(audio, Buffer.concat(chunks));
      const ok = await runWhisper(audio, txt, "LIVE");
      ws.send(
        JSON.stringify(
          ok
            ? { status: "ok", transcript: fs.readFileSync(txt, "utf8") }
            : { status: "error" }
        )
      );
    } else chunks.push(Buffer.from(msg));
  });
});


// ==================================================
// Discussion List API
// ==================================================
app.get("/api/list-recordings", (_, res) => {
  try {
    const seen = new Set();

    const files = fs
      .readdirSync(uploadDir)
      .filter((f) => /\.(wav|mp3|webm|mp4)$/.test(f))
      .map((f) => {
        const base = f.replace(/\.(wav|mp3|webm|mp4)$/, "");
        const transcript = path.join(transcriptDir, `${base}.txt`);
        const metaFile = path.join(transcriptDir, `${base}.json`);
        const meta = fs.existsSync(metaFile)
          ? JSON.parse(fs.readFileSync(metaFile, "utf8"))
          : {};

        return {
          filename: base,
          title: meta.title || base,
          leader: meta.leader || "לא צוין",
          type: meta.type || "recorded",
          date: fs.existsSync(path.join(uploadDir, f))
            ? new Date(fs.statSync(path.join(uploadDir, f)).mtime).toLocaleDateString("he-IL")
            : "",
          transcriptPreview: fs.existsSync(transcript)
            ? fs.readFileSync(transcript, "utf8").slice(0, 120)
            : "",
          status: fs.existsSync(transcript) ? "ready" : "processing",
        };
      })
      .filter((item) => {
        if (seen.has(item.filename)) return false;
        seen.add(item.filename);
        return true;
      });

    res.json({ status: "ok", recordings: files });
  } catch (err) {
    console.error("❌ list-recordings:", err);
    res.status(500).json({ status: "error" });
  }
});

// ==================================================
// Discussion Details + Transcript APIs (for DiscussionView)
// ==================================================
app.get("/api/discussion-details/:filename", (req, res) => {
  try {
    const filename = req.params.filename.replace(/\.(wav|mp3|webm|mp4)$/, "");
    const transcriptPath = path.join(transcriptDir, `${filename}.txt`);
    const metaPath = path.join(transcriptDir, `${filename}.json`);

    let meta = {};
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    }

    const relatedFiles = fs
    .readdirSync(transcriptDir)
    .filter(
    (f) =>
      f.startsWith(filename) &&
      (f.endsWith(".txt") || f.endsWith(".pdf") || f.endsWith(".docx"))
    )
    .map((f) => ({
    name: f,
    path: `/transcripts/${encodeURIComponent(f)}`,
    }));


    res.json({
      filename,
      title: meta.title || filename,
      leader: meta.leader || "לא צוין",
      type: meta.type || "recorded",
      date: meta.created
        ? new Date(meta.created).toLocaleDateString("he-IL")
        : "",
      participants: meta.participants || "לא צוין",
      duration: meta.duration || "לא צוין",
      relatedFiles,
      status: fs.existsSync(transcriptPath) ? "ready" : "processing",
    });
  } catch (err) {
    console.error("❌ Error in /api/discussion-details:", err);
    res.status(500).json({ status: "error" });
  }
});

app.get("/api/transcript/:filename", (req, res) => {
  try {
    const filename = req.params.filename.replace(/\.(wav|mp3|webm|mp4)$/, "");
    const txtPath = path.join(transcriptDir, `${filename}.txt`);

    if (!fs.existsSync(txtPath))
      return res.status(404).json({ status: "not_found", transcript: "" });

    const transcript = fs.readFileSync(txtPath, "utf8");
    res.json({ status: "ok", transcript });
  } catch (err) {
    console.error("❌ Error in /api/transcript:", err);
    res.status(500).json({ status: "error", transcript: "" });
  }
});

// ==================================================
const PORT = 3000;

// ==================================================
// Delete Files API
// ==================================================
app.post("/api/delete-files", (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "No files provided" });
  }

  try {
    const deleted = [];
    files.forEach((base) => {
      // מוחקים את כל סוגי הקבצים המשויכים
      const targets = fs
        .readdirSync(uploadDir)
        .filter((f) => f.startsWith(base))
        .map((f) => path.join(uploadDir, f))
        .concat(
          fs
            .readdirSync(transcriptDir)
            .filter((f) => f.startsWith(base))
            .map((f) => path.join(transcriptDir, f))
        );

      for (const filePath of targets) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deleted.push(path.basename(filePath));
        }
      }
    });

    res.json({ status: "ok", deleted });
  } catch (err) {
    console.error("❌ Error deleting files:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

app.listen(PORT, () =>
  console.log(`HTTP server running on ${PORT} | WS on ${WS_PORT}`)
);
