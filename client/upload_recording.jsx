import React, { useState } from 'react';
import { Upload, FileAudio, Loader2, Edit3, Scissors } from 'lucide-react';

export default function UploadRecording() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [showSegments, setShowSegments] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setShowSegments(true);
    }, 2500);
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center p-10 bg-gradient-to-b from-white to-gray-100 relative overflow-hidden">
      {/* Header */}
      <h1 className="text-4xl font-semibold text-gray-800 mb-10 z-10 flex items-center gap-3">
        <Upload className="w-8 h-8 text-pink-500" /> העלאת הקלטה קיימת
      </h1>

      {/* Upload area */}
      <label
        htmlFor="audio-upload"
        className="w-full max-w-md flex flex-col items-center justify-center p-10 border-2 border-dashed border-pink-300 rounded-2xl cursor-pointer bg-white hover:bg-pink-50 transition-all shadow-sm"
      >
        {file ? (
          <div className="flex flex-col items-center text-center">
            <FileAudio className="w-16 h-16 text-pink-500 mb-4" />
            <p className="text-lg font-semibold text-gray-700">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <>
            <Upload className="w-16 h-16 text-pink-400 mb-4" />
            <p className="text-gray-600 text-lg">גרור קובץ לכאן או לחץ לבחירה</p>
            <p className="text-sm text-gray-400 mt-2">תומך בקבצי .wav, .mp3, .m4a, .ogg</p>
          </>
        )}
        <input
          type="file"
          id="audio-upload"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Discussion info inputs */}
      <div className="w-full max-w-md mt-10 bg-white p-6 rounded-2xl shadow-md border border-pink-100">
        <label className="block mb-3 text-gray-600 font-medium">נושא הדיון</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="לדוגמה: ישיבת צוות רבעונית"
          className="w-full mb-5 border rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
        />

        <label className="block mb-3 text-gray-600 font-medium">הערות נוספות</label>
        <textarea
          rows="3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="הוסף מידע נוסף על ההקלטה..."
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
        />
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`mt-10 py-4 px-12 rounded-2xl font-bold text-white shadow-lg transition-all ${
          file
            ? 'bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-6 h-6" /> מעלה ומעבד את הקובץ...
          </span>
        ) : (
          'העלה והצג מקטעים'
        )}
      </button>

      {/* Back button */}
      <button className="mt-6 text-gray-600 hover:text-pink-600 transition-all">
        חזור למסך הראשי
      </button>

      {/* AI Segments view mockup */}
      {showSegments && (
        <div className="mt-12 w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-pink-100 animate-fadeIn">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Scissors className="w-6 h-6 text-pink-500" /> הצגת מקטעים לפי זיהוי AI
          </h2>

          <div className="space-y-4 text-gray-700">
            <div className="p-4 border rounded-xl bg-gray-50 hover:bg-pink-50 transition-all">
              <p className="font-semibold">מקטע 1</p>
              <p className="text-sm text-gray-600">00:00 - 01:20 | הצגת פתיחה ודברי פתיחה</p>
            </div>
            <div className="p-4 border rounded-xl bg-gray-50 hover:bg-pink-50 transition-all">
              <p className="font-semibold">מקטע 2</p>
              <p className="text-sm text-gray-600">01:21 - 03:45 | דיון בנושאים מרכזיים</p>
            </div>
            <div className="p-4 border rounded-xl bg-gray-50 hover:bg-pink-50 transition-all">
              <p className="font-semibold">מקטע 3</p>
              <p className="text-sm text-gray-600">03:46 - 06:00 | סיכום ונקודות פעולה</p>
            </div>
          </div>

          <button className="mt-8 py-3 px-10 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-xl shadow hover:opacity-90 transition-all">
            התחל תמלול מלא
          </button>
        </div>
      )}

      {isUploading && (
        <div className="mt-12 text-gray-500 text-lg animate-pulse">
          🤖 AI מזהה את מבנה ההקלטה ומכין את המקטעים...
        </div>
      )}
    </div>
  );
}
