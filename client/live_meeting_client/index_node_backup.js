// LIVE MEETING CLIENT
// Simulates sending live audio chunks to the backend WebSocket

import fs from "fs";
import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  console.log("[LIVE] Connected to backend");

  // Simulate microphone streaming by sending one file in chunks
  const file = "sample_audio.webm"; // must exist in this folder
  const data = fs.readFileSync(file);
  const chunkSize = 8000;

  for (let i = 0; i < data.length; i += chunkSize) {
    ws.send(data.slice(i, i + chunkSize));
  }

  // Signal end of stream
  ws.send("end");
});

ws.on("message", (msg) => {
  const result = JSON.parse(msg.toString());
  if (result.status === "ok") {
    console.log("[LIVE] Transcription:\n", result.transcript.slice(0, 400));
  } else {
    console.error("[LIVE] Error:", result.message);
  }
});

