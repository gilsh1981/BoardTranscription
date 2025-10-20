import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react'; // clean modern icon

export default function DiscussionRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [pulse, setPulse] = useState(false);

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
    const h = String(Math.floor(t / 3600)).padStart(2, '0');
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center p-10 bg-gradient-to-b from-white to-gray-100 relative overflow-hidden">
      {/* Background AI waves */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,182,193,0.5),rgba(255,165,0,0.2))]" />

      {/* Header */}
      <h1 className="text-4xl font-semibold text-gray-800 mb-10 z-10">מוכנים להקלטה</h1>

      {/* Timer */}
      <div className="text-6xl font-mono text-gray-800 tracking-widest mb-8 z-10">
        {formatTime(time)}
      </div>

      {/* Recording button with animated Mic icon */}
      <div className="relative flex flex-col items-center gap-6 z-10">
        <div
          className={`relative w-48 h-48 flex items-center justify-center rounded-full transition-all duration-500 cursor-pointer ${
            isRecording
              ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_50px_rgba(255,0,0,0.5)]'
              : 'bg-gradient-to-r from-pink-500 to-orange-400 shadow-[0_0_50px_rgba(255,105,180,0.4)]'
          }`}
          onClick={() => setIsRecording(!isRecording)}
        >
          <Mic
            size={70}
            color="white"
            className={`transition-all duration-300 ${pulse && isRecording ? 'scale-110 opacity-80' : 'opacity-100'}`}
          />
        </div>
        <button
          onClick={() => setIsRecording(!isRecording)}
          className="text-lg font-medium text-gray-700 hover:text-pink-600 transition-colors"
        >
          {isRecording ? 'המערכת מאזינה...' : 'לחץ כדי להתחיל הקלטה'}
        </button>
      </div>

      {/* Microphone control */}
      <button className="mt-10 px-8 py-3 text-gray-700 font-semibold text-lg border border-gray-300 rounded-full hover:bg-gray-100 transition-all z-10">
        כיבוי מיקרופון 🔇
      </button>

      {/* Info section */}
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

      {/* Finish button */}
      {isRecording && (
        <button className="mt-16 py-4 px-12 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-all z-10">
          סיים דיון ושמור תמלול
        </button>
      )}
    </div>
  );
}
