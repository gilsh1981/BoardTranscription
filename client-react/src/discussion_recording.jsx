import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function DiscussionRecording() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [discussionInfo, setDiscussionInfo] = useState(null);
  const [time, setTime] = useState(0);
  const [polling, setPolling] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  // ✅ טוען את פרטי הדיון מה-sessionStorage
  useEffect(() => {
    const info = sessionStorage.getItem("discussionData");
    if (info) setDiscussionInfo(JSON.parse(info));
  }, []);

  // עיצוב זמן (00:mm:ss)
  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `00:${m}:${s}`;
  };

  // התחלת הקלטה
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);

    mediaRecorder.onstop = async () => {
      clearInterval(timerRef.current);
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      // ✅ שם קובץ לפי נושא הדיון
      const fileName =
        discussionInfo?.topic?.replace(/\s+/g, "_") || `discussion_${Date.now()}`;

      try {
        const formData = new FormData();
        formData.append("audio", blob, `${fileName}.webm`);
        formData.append("topic", discussionInfo?.topic || "דיון ללא שם");
        formData.append("leaderName", discussionInfo?.leaderName || "לא צוין");
        formData.append("language", discussionInfo?.language || "עברית");
        formData.append("duration", formatTime(time));

        // 🟢 שורה קריטית — מזהה שההקלטה בוצעה כאן
        formData.append("source", "recorded");

        // רק לבדיקה - נרשום בקונסול
        for (let [key, val] of formData.entries()) {
          console.log("📦 formData:", key, val);
        }

        setPolling(true);

        await axios.post("http://localhost:3000/api/upload-audio", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        alert("✅ ההקלטה נשמרה ונשלחה לעיבוד!");
      } catch (err) {
        console.error("❌ שגיאה בשליחת ההקלטה:", err);
        alert("❌ שגיאה בשליחת ההקלטה לשרת");
      } finally {
        setPolling(false);
        navigate("/");
      }
    };

    mediaRecorder.start();
    setRecording(true);
    setTime(0);
    timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
  };

  // עצירת הקלטה
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-[#f8f8f8] text-gray-800 font-[Heebo]"
    >
      {/* חזרה לדשבורד */}
      <div className="absolute top-8 right-8">
        <button
          onClick={() => navigate("/")}
          className="bg-gradient-to-l from-[#ff6f00] to-[#b347ff] text-white py-2 px-5 rounded-lg font-bold shadow hover:opacity-90 transition"
        >
          ⬅️ חזרה לדשבורד
        </button>
      </div>

      <h1 className="text-3xl font-bold text-[#b347ff] mb-8">מוכנים להקלטה</h1>
      <div className="text-5xl font-mono mb-6">{formatTime(time)}</div>

      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={polling}
        className={`w-32 h-32 rounded-full shadow-lg flex items-center justify-center text-5xl transition-all ${
          recording
            ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
            : "bg-gradient-to-l from-[#ff6f00] to-[#b347ff] hover:opacity-90 text-white"
        } ${polling ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        🎤
      </button>

      <p className="mt-4 text-gray-600">
        {polling
          ? "מעבד תמלול... אנא המתן"
          : recording
          ? "לחץ כדי לעצור את ההקלטה"
          : "לחץ כדי להתחיל הקלטה"}
      </p>

      {/* פרטי דיון */}
      {discussionInfo && (
        <div className="mt-8 flex flex-col gap-2 text-center text-gray-700">
          <div>
            <strong>נושא:</strong> {discussionInfo.topic || "לא צוין"}
          </div>
          <div>
            <strong>מטרה:</strong> {discussionInfo.purpose || "לא צוין"}
          </div>
          <div>
            <strong>שפה:</strong> {discussionInfo.language || "עברית"}
          </div>
          <div>
            <strong>מוביל:</strong> {discussionInfo.leaderName || "לא צוין"}
          </div>
        </div>
      )}

      {/* תצוגה מקדימה */}
      {audioURL && (
        <div className="mt-6 w-[400px] text-center">
          <p className="font-semibold mb-2">🎧 תצוגה מקדימה:</p>
          <audio src={audioURL} controls className="w-full rounded-lg shadow" />
        </div>
      )}
    </div>
  );
}
