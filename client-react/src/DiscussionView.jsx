import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function DiscussionView() {
  const { filename } = useParams();
  const navigate = useNavigate();

  const [discussion, setDiscussion] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("loading");
  const [audioURL, setAudioURL] = useState("");

  useEffect(() => {
    async function fetchDiscussion() {
      try {
        // מנקים ומפענחים את שם הקובץ
        const cleanFilename = decodeURIComponent(filename);

        // ✅ בקשת פרטי ההקלטה — בלי להוסיף .wav
        const detRes = await axios.get(
          `http://localhost:3000/api/discussion-details/${encodeURIComponent(cleanFilename)}`
        );

        const data = detRes.data;
        setDiscussion(data);

        // ✅ נתיב הקובץ האמיתי לשמע
        setAudioURL(`http://localhost:3000/uploads/${encodeURIComponent(cleanFilename)}.wav`);

        // ✅ בקשת תמלול — גם בלי להוסיף .wav
        try {
          const txtRes = await axios.get(
            `http://localhost:3000/api/transcript/${encodeURIComponent(cleanFilename)}`
          );
          setTranscript(txtRes.data.transcript || "");
          setStatus("ready");
        } catch {
          setStatus(data.status || "processing");
        }
      } catch (err) {
        console.error("❌ שגיאה בטעינת הדיון:", err);
        setStatus("error");
      }
    }

    fetchDiscussion();
  }, [filename]);

  // טקסט לפי סטטוס
  const getStatusText = () => {
    switch (status) {
      case "ready":
        return "✅ מוכן";
      case "processing":
        return "⏳ בעיבוד...";
      case "error":
        return "❌ שגיאה";
      default:
        return "⌛ טוען...";
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white font-[Heebo] p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold text-[#b347ff]">
          פרטי דיון:{" "}
          {filename
            ? decodeURIComponent(filename).replace(/\.webm|\.wav/gi, "")
            : "לא צוין"}
        </h1>

        <button
          onClick={() => navigate("/")}
          className="bg-gradient-to-l from-[#ff6f00] to-[#b347ff] text-white py-2 px-5 rounded-lg font-bold shadow hover:opacity-90 transition flex items-center gap-2"
        >
          חזרה לדשבורד <span className="text-lg">⬅️</span>
        </button>
      </div>

      {/* Audio Player */}
      <div className="bg-gray-50 border rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">🎧 נגן הקלטה</h2>
        {audioURL ? (
          <audio src={audioURL} controls className="w-full rounded-lg shadow-md" />
        ) : (
          <p className="text-sm text-gray-600">לא נמצא קובץ שמע</p>
        )}
        <p className="text-sm text-gray-600 mt-2">סטטוס: {getStatusText()}</p>
      </div>

      {/* Discussion Details */}
      {discussion && (
        <div className="bg-gray-50 border rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">🗂️ פרטי הדיון</h2>
          <div className="grid grid-cols-2 gap-4 text-gray-700 text-sm">
            <p>
              <strong>סוג:</strong> {discussion.type || "הקלטה"}
            </p>
            <p>
              <strong>תאריך:</strong> {discussion.date || "לא צוין"}
            </p>
            <p>
              <strong>משך:</strong> {discussion.duration || "לא צוין"}
            </p>
            <p>
              <strong>משתתפים:</strong> {discussion.participants || "לא צוין"}
            </p>
          </div>
        </div>
      )}

      {/* Transcript */}
      <div className="bg-gray-50 border rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">📝 תמלול הדיון</h2>
        {status === "ready" ? (
          <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {transcript || "אין תמלול זמין לקובץ זה"}
          </pre>
        ) : status === "processing" ? (
          <div className="text-orange-500 font-semibold animate-pulse">
            הקובץ בעיבוד... אנא המתן ⏳
          </div>
        ) : status === "error" ? (
          <div className="text-red-500 font-semibold">שגיאה בטעינת התמלול 😢</div>
        ) : (
          <div className="text-gray-500">טוען...</div>
        )}
      </div>
    </div>
  );
}
