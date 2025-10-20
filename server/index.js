// ===============================================
// BoardTranscription Backend
// Node.js + Express + Whisper Integration
// ===============================================

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");

const app = express();

// -------------------------------
// Folder Setup
// -------------------------------
const uploadDir = "/bt/boardtranscription/uploads";
const transcriptDir = "/btdisk/boardtranscription/transcripts";

[uploadDir, transcriptDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));
app.use("/transcripts", express.static(transcriptDir));

// -------------------------------
// Root route
// -------------------------------
app.get("/", (req, res) => {
  res.send("BoardTranscription backend running — live, recording, and supervised modes ready");
});

// -------------------------------
// Multer config
// -------------------------------
const upload = multer({ dest: uploadDir });

// ==================================================
// 1️⃣ RECORDING MODE (post-meeting transcription)
// ==================================================
app.post("/api/transcribe/recording", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const originalName = req.file.originalname;
  const tempPath = req.file.path;
  const targetPath = path.join(uploadDir, originalName);
  const transcriptPath = path.join(transcriptDir, `${originalName}.txt`);

  fs.rename(tempPath, targetPath, (err) => {
    if (err) {
      console.error("❌ [ERROR] File rename failed:", err);
      return res.status(500).json({ error: "File rename failed" });
    }

    console.log(`[RECORDING] Saved: ${originalName}`);
    console.log(`[TRANSCRIBE] Running Whisper for ${originalName}`);

    const py = spawn("python3", ["transcribe_local.py", targetPath, transcriptPath]);

    let errorOutput = "";
    py.stdout.on("data", (d) => process.stdout.write(`[PY] ${d}`));
    py.stderr.on("data", (d) => (errorOutput += d.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        console.error(`[FAIL] Whisper transcription failed for ${originalName}`);
        return res.status(500).json({
          status: "error",
          details: errorOutput,
        });
      }

      const text = fs.existsSync(transcriptPath)
        ? fs.readFileSync(transcriptPath, "utf8")
        : "";
      res.json({
        status: "ok",
        mode: "recording",
        file: originalName,
        transcriptPreview: text.slice(0, 250) + "...",
      });
    });
  });
});

// ==================================================
// 2️⃣ SUPERVISED MODE (secretary-controlled)
// ==================================================
app.post("/api/transcribe/supervised", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filename = req.file.originalname;
  const source = req.file.path;
  const target = path.join(uploadDir, filename);
  const transcriptFile = path.join(transcriptDir, `${filename}.txt`);

  fs.renameSync(source, target);
  console.log(`[SUPERVISED] File received: ${filename}`);

  // Same Whisper process
  const py = spawn("python3", ["transcribe_local.py", target, transcriptFile]);
  let errLog = "";

  py.stdout.on("data", (d) => console.log(`[PY SUPERVISED] ${d}`));
  py.stderr.on("data", (d) => (errLog += d.toString()));

  py.on("close", () => {
    const text = fs.existsSync(transcriptFile)
      ? fs.readFileSync(transcriptFile, "utf8")
      : "";
    res.json({
      status: "ok",
      mode: "supervised",
      transcriptPreview: text.slice(0, 250) + "...",
      errorLog: errLog || null,
    });
  });
});

// ==================================================
// 3️⃣ LIVE MODE (WebSocket — real-time meeting)
// ==================================================
const WS_PORT = 8080;
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`[WS] Live WebSocket ready at ws://localhost:${WS_PORT}`);

wss.on("connection", (ws) => {
  console.log("[WS] Client connected");
  const chunks = [];

  ws.on("message", (msg) => {
    if (msg.toString() === "end") {
      const timestamp = Date.now();
      const audioFile = path.join(uploadDir, `live_${timestamp}.webm`);
      const transcriptFile = path.join(transcriptDir, `live_${timestamp}.txt`);

      fs.writeFileSync(audioFile, Buffer.concat(chunks));
      console.log(`[WS] Stream saved: ${audioFile}`);

      const py = spawn("python3", ["transcribe_local.py", audioFile, transcriptFile]);

      py.stdout.on("data", (data) => console.log(`[PY LIVE] ${data}`));
      py.stderr.on("data", (data) => console.error(`[ERR LIVE] ${data}`));

      py.on("close", () => {
        if (fs.existsSync(transcriptFile)) {
          const text = fs.readFileSync(transcriptFile, "utf8");
          ws.send(JSON.stringify({ status: "ok", mode: "live", transcript: text }));
        } else {
          ws.send(JSON.stringify({ status: "error", message: "Transcription failed" }));
        }
      });
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
  const file = path.join(transcriptDir, `${req.params.filename}.txt`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Transcript not found" });
  const text = fs.readFileSync(file, "utf8");
  res.json({ status: "ok", transcript: text });
});

// ==================================================
// HTTP Server start
// ==================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`HTTP server running on port ${PORT} | WebSocket on ${WS_PORT}`)
);

