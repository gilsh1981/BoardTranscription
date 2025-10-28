import React, { useState } from "react";
import axios from "axios";
import { Upload, FileAudio, Loader2, Scissors, FileDown, Save, FileText } from "lucide-react";

export default function UploadRecording() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [uploadedFile, setUploadedFile] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("topic", title);
      formData.append("leaderName", notes);

      const response = await axios.post("http://localhost:3000/api/upload-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.status === "ok") {
        setTranscriptText(response.data.transcriptPreview || "");
        setUploadedFile(response.data.filename);
        setShowTranscript(true);
      } else {
        alert("שגיאה בעת עיבוד הקובץ.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("שגיאה בעת שליחת הקובץ לשרת.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDiscussion = () => {
    console.log("Saving discussion:", { title, notes, transcriptText });
    alert("התמלול נשמר והועבר לדיונים ");
  };

  const handleDownloadWord = () => {
    if (!uploadedFile) {
      alert("אין קובץ להורדה.");
      return;
    }
    const url = `http://localhost:3000/api/download-docx/${encodeURIComponent(uploadedFile)}`;
    window.open(url, "_blank");
  };

  const handleDownloadPDF = () => {
    if (!uploadedFile) {
      alert("אין קובץ להורדה.");
      return;
    }
    const url = `http://localhost:3000/api/download-pdf/${encodeURIComponent(uploadedFile)}?open=false`;
    window.open(url, "_blank");
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center p-10 bg-gradient-to-b from-white to-gray-100"
    >
      <h1 className="text-4xl font-semibold text-gray-800 mb-10 flex items-center gap-3">
        <Upload className="w-8 h-8 text-pink-500" /> העלאת הקלטה קיימת
      </h1>

      {/* Upload Section */}
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
        <input type="file" id="audio-upload" accept="audio/*" onChange={handleFileChange} className="hidden" />
      </label>

      {/* Discussion Info */}
      <div className="w-full max-w-md mt-10 bg-white p-6 rounded-2xl shadow-md border border-pink-100">
        <label className="block mb-3 text-gray-600 font-medium">נושא הדיון</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="לדוגמה: ישיבת הנהלה"
          className="w-full mb-5 border rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
        />

        <label className="block mb-3 text-gray-600 font-medium">מוביל הישיבה / הערות נוספות</label>
        <textarea
          rows="3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="הוסף מידע נוסף..."
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
        />
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`mt-10 py-4 px-12 rounded-2xl font-bold text-white shadow-lg transition-all ${
          file ? "bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90" : "bg-gray-300 cursor-not-allowed"
        }`}
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-6 h-6" /> מעלה ומעבד את הקובץ...
          </span>
        ) : (
          "העלה והצג תמלול"
        )}
      </button>

      {/* Transcript Editor */}
      {showTranscript && (
        <div className="mt-12 w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-pink-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Scissors className="w-6 h-6 text-pink-500" /> תמלול ראשוני
          </h2>

          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            rows="12"
            className="w-full border rounded-xl p-4 text-gray-700 bg-gray-50 focus:ring-2 focus:ring-pink-400 focus:outline-none"
          />

          <div className="flex flex-row justify-end gap-4 mt-6">
            <button
              onClick={handleSaveDiscussion}
              className="py-3 px-8 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-xl shadow hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> שמור והעבר לדיונים
            </button>

            <button
              onClick={handleDownloadWord}
              className="py-3 px-8 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-all flex items-center gap-2"
            >
              <FileDown className="w-5 h-5" /> הורד כ־Word
            </button>

            <button
              onClick={handleDownloadPDF}
              className="py-3 px-8 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-all flex items-center gap-2"
            >
              <FileText className="w-5 h-5" /> הורד כ־PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
