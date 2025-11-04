import React, { useState, useRef, useEffect } from "react";
import { Edit3, Save, Trash2, FileText } from "lucide-react";

export default function DictationPage() {
  const [segments, setSegments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  useEffect(() => {
    if (isRecording) {
      setTime(0);
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    setSegments([]);
    setTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const wsUrl = `ws://${window.location.hostname}:2700`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const recordChunk = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
          const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0 && ws.readyState === 1) {
              e.data.arrayBuffer().then((buf) => ws.send(buf));
            }
          };
          mediaRecorder.start();
          setTimeout(() => mediaRecorder.stop(), 2500);
        };

        recordChunk();
        timerRef.current = setInterval(recordChunk, 2500);
        setIsRecording(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.partial && data.partial.trim()) {
            setSegments((prev) => [
              ...prev,
              {
                id: Date.now(),
                start: time > 2 ? formatTime(time - 2) : formatTime(0),
                end: formatTime(time),
                text: data.partial.trim(),
                editing: false,
              },
            ]);
          }
        } catch (e) {
          console.warn("Bad WS message", e);
        }
      };

      ws.onerror = (e) => console.error("WS error", e);
      ws.onclose = () => setIsRecording(false);
    } catch (err) {
      alert("לא ניתן להפעיל את המיקרופון. בדוק הרשאות בדפדפן.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive")
      mediaRecorderRef.current.stop();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send("end");
      wsRef.current.close();
    }
  };

  const handleClear = () => {
    if (window.confirm("למחוק את כל התמלול?")) {
      setSegments([]);
    }
  };

  const toggleEdit = (id) =>
    setSegments((prev) =>
      prev.map((seg) =>
        seg.id === id ? { ...seg, editing: !seg.editing } : seg
      )
    );

  const handleChange = (id, value) =>
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, text: value } : seg))
    );

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col items-center p-10">
      <div className="w-full max-w-6xl bg-white p-6 rounded-2xl shadow-md border border-pink-100 mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FileText className="text-pink-500 w-8 h-8" /> מסך ההכתבה
            </h1>
            <p className="text-gray-600 mt-2">שם ההכתבה: ישיבת הנהלה</p>
            <p className="text-gray-600">שם המשתמש: admin user</p>
          </div>
          <div className="text-gray-600 text-sm text-left">
            תאריך ושעה: {new Date().toLocaleString("he-IL")}
            <br />
            שפה: <span className="font-semibold text-gray-800">he</span>
          </div>
        </div>

        <div className="flex justify-center items-center gap-8 mt-8">
          <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-lg font-mono text-gray-700">
              {formatTime(time)}
            </span>
          </div>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-10 py-4 text-white font-bold rounded-2xl shadow-lg text-lg transition-all ${
              isRecording
                ? "bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90"
                : "bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90"
            }`}
          >
            {isRecording ? "הפסק הכתבה" : "התחל הכתבה"}
          </button>
        </div>
      </div>

      {segments.length > 0 && (
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-md border border-pink-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-pink-50 text-gray-700 border-b border-pink-100">
              <tr>
                <th className="p-4">זמן</th>
                <th className="p-4">תמלול</th>
                <th className="p-4">עריכה</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg) => (
                <tr key={seg.id} className="border-b hover:bg-pink-50 transition-all">
                  <td className="p-4 font-mono text-sm text-gray-500">
                    {seg.start} - {seg.end}
                  </td>
                  <td className="p-4">
                    {seg.editing ? (
                      <textarea
                        value={seg.text}
                        onChange={(e) => handleChange(seg.id, e.target.value)}
                        rows="3"
                        className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none text-gray-800"
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed">{seg.text}</p>
                    )}
                  </td>
                  <td className="p-4 flex gap-4 items-center justify-center">
                    <button
                      onClick={() => toggleEdit(seg.id)}
                      className="p-3 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-all"
                    >
                      {seg.editing ? <Save size={18} /> : <Edit3 size={18} />}
                    </button>
                    <button
                      onClick={handleClear}
                      className="p-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
