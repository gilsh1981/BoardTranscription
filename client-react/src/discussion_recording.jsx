import React, { useState, useEffect, useRef } from "react";
import { Mic } from "lucide-react";

export default function DiscussionRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  useEffect(() => {
    let timer;
    if (isRecording) timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    let pulseTimer;
    if (isRecording) pulseTimer = setInterval(() => setPulse((p) => !p), 600);
    return () => clearInterval(pulseTimer);
  }, [isRecording]);

  const formatTime = (t) => {
    const h = String(Math.floor(t / 3600)).padStart(2, "0");
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const s = String(t % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "audio/webm" });
        const filename = `live_${Date.now()}.webm`;
        uploadRecordedFile(blob, filename);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setTime(0);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function uploadRecordedFile(fileBlob, filename) {
    try {
      const formData = new FormData();
      formData.append("file", fileBlob, filename);

      const response = await fetch("http://localhost:3000/api/transcribe/live", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.status === "ok") {
        console.log("Transcription completed:", result.file);
        setTranscript(result.transcriptPreview);
      } else {
        console.error("Transcription error:", result.details || "Unknown error");
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center p-10 bg-gradient-to-b from-white to-gray-100 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,182,193,0.5),rgba(255,165,0,0.2))]" />

      <h1 className="text-4xl font-semibold text-gray-800 mb-10 z-10">מוכנים להקלטה</h1>

      <div className="text-6xl font-mono text-gray-800 tracking-widest mb-8 z-10">
        {formatTime(time)}
      </div>

      <div className="relative flex flex-col items-center gap-6 z-10">
        <div
          className={`relative w-48 h-48 flex items-center justify-center rounded-full transition-all duration-500 cursor-pointer ${
            isRecording
              ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_50px_rgba(255,0,0,0.5)]"
              : "bg-gradient-to-r from-pink-500 to-orange-400 shadow-[0_0_50px_rgba(255,105,180,0.4)]"
          }`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          <Mic
            size={70}
            color="white"
            className={`transition-all duration-300 ${
              pulse && isRecording ? "scale-110 opacity-80" : "opacity-100"
            }`}
          />
        </div>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className="text-lg font-medium text-gray-700 hover:text-pink-600 transition-colors"
        >
          {isRecording ? "המערכת מאזינה..." : "לחץ כדי להתחיל הקלטה"}
        </button>
      </div>

      <button className="mt-10 px-8 py-3 text-gray-700 font-semibold text-lg border border-gray-300 rounded-full hover:bg-gray-100 transition-all z-10">
        כיבוי מיקרופון
      </button>

      <div className="flex flex-wrap justify-center gap-6 text-gray-700 text-lg mt-14 z-10">
        <div className="bg-white border border-pink-100 rounded-2xl px-6 py-4 shadow-md">
          נושא: <span className="font-semibold text-gray-900">ישיבת הנהלה</span>
        </div>
        <div className="bg-white border border-pink-100 rounded-2xl px-6 py-4 shadow-md">
          מטרה: <span className="font-semibold text-gray-900">בדיקת יעדים</span>
        </div>
        <div className="bg-white border border-pink-100 rounded-2xl px-6 py-4 shadow-md">
          שפה: <span className="font-semibold text-gray-900">עברית</span>
        </div>
      </div>

      {isRecording && (
        <button
          onClick={stopRecording}
          className="mt-16 py-4 px-12 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-all z-10"
        >
          סיים דיון ושמור תמלול
        </button>
      )}

      {transcript && (
        <div className="mt-10 p-6 bg-white rounded-2xl shadow-lg w-3/4 text-right text-gray-800">
          <h2 className="text-2xl font-bold mb-4">תמלול שהתקבל:</h2>
          <pre className="whitespace-pre-wrap text-lg leading-relaxed">{transcript}</pre>
        </div>
      )}
    </div>
  );
}

