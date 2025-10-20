// DictationPage.jsx – מסך ההכתבה
import React, { useState, useEffect } from 'react';
import { Play, Pause, Edit3, Save, Trash2, FileText, Loader2, Mic, MicOff, Upload } from 'lucide-react';

export default function DictationPage() {
  const [segments, setSegments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const togglePlay = (id) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, playing: !seg.playing } : { ...seg, playing: false }))
    );
  };

  const toggleEdit = (id) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, editing: !seg.editing } : seg))
    );
  };

  const handleChange = (id, value) => {
    setSegments((prev) => prev.map((seg) => (seg.id === id ? { ...seg, text: value } : seg)));
  };

  const handleSave = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col items-center p-10">
      {/* Header */}
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
            תאריך ושעה: {new Date().toLocaleString('he-IL')}<br />
            שפה: <span className="font-semibold text-gray-800">he-en</span>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center items-center gap-8 mt-8">
          <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-lg font-mono text-gray-700">{formatTime(time)}</span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full shadow text-gray-700 border border-gray-300 hover:bg-gray-100 transition-all`}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-10 py-4 text-white font-bold rounded-2xl shadow-lg text-lg transition-all ${
              isRecording
                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90'
                : 'bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90'
            }`}
          >
            {isRecording ? 'הפסק הכתבה' : 'התחל הכתבה'}
          </button>

          <button className="px-8 py-3 bg-sky-500 text-white rounded-xl shadow-md font-semibold hover:bg-sky-600 transition-all flex items-center gap-2">
            <Upload size={18} /> שליחה וסיום
          </button>
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="flex items-center gap-3 text-pink-600 mb-8 animate-pulse">
          <Loader2 className="animate-spin w-6 h-6" /> AI שומר ומעבד את השינויים...
        </div>
      )}

      {/* Empty State */}
      {segments.length === 0 && !isRecording && (
        <div className="text-gray-400 mt-20 italic animate-pulse">
          AI ממתין לתמלול... התחל הכתבה כדי להתחיל להזין טקסטים בזמן אמת.
        </div>
      )}

      {/* Segments Table */}
      {segments.length > 0 && (
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-md border border-pink-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-pink-50 text-gray-700 border-b border-pink-100">
              <tr>
                <th className="p-4">זמן</th>
                <th className="p-4">תמלול</th>
                <th className="p-4">פעולות</th>
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
                      onClick={() => togglePlay(seg.id)}
                      className={`p-3 rounded-full shadow hover:scale-110 transition-all ${
                        seg.playing ? 'bg-red-500 text-white' : 'bg-pink-100 text-pink-600'
                      }`}
                    >
                      {seg.playing ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                      onClick={() => toggleEdit(seg.id)}
                      className="p-3 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-all"
                    >
                      {seg.editing ? <Save size={18} /> : <Edit3 size={18} />}
                    </button>
                    <button className="p-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-6 mt-10">
        <button className="py-3 px-8 bg-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-300 transition-all">
          נקה הכל
        </button>
        <button
          onClick={handleSave}
          className="py-3 px-10 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-xl shadow hover:opacity-90 transition-all"
        >
          שמור שינויים
        </button>
        <button className="py-3 px-8 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-semibold shadow hover:opacity-90 transition-all">
          יצוא קובץ
        </button>
      </div>
    </div>
  );
}
